import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Account } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom database ID handling per Firebase integration guidelines
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// OperationType and FirestoreErrorInfo according to Firebase Integration guidelines
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn(`[Firestore ${operationType}] Handled Firestore Error:`, JSON.stringify(errInfo));
  return errInfo;
}

// Resilient test connection to Firestore on demand with graceful offline fallback
export async function testFirestoreConnection(retries = 1, delayMs = 500): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const testDocRef = doc(db, "test", "connection");
      await getDoc(testDocRef);
      return true;
    } catch (error: any) {
      const isUnavailable =
        error?.code === "unavailable" ||
        error?.code === "failed-precondition" ||
        (error?.message && (
          error.message.includes("offline") ||
          error.message.includes("unavailable") ||
          error.message.includes("Could not reach Cloud Firestore")
        ));

      if (!isUnavailable) {
        return true;
      }

      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
      }
    }
  }
  return false;
}

// Helper function to sync/save user profile to Firestore
export async function syncUserProfileToFirestore(user: FirebaseUser, extraInfo?: Partial<Account>): Promise<Account> {
  const path = `users/${user.uid}`;
  const userRef = doc(db, "users", user.uid);
  
  const defaultAccount: Account = {
    email: user.email || "",
    username: user.email ? user.email.split("@")[0] : `student_${user.uid.slice(0, 6)}`,
    displayName: user.displayName || user.email?.split("@")[0] || "طالب مميز",
    role: "member",
    branch: extraInfo?.branch || "",
    gradeLevel: extraInfo?.gradeLevel || "4eme_bac",
    avatar: user.photoURL || extraInfo?.avatar || null,
    moderatorRooms: [],
    banned: false,
    bannedUntil: null,
    oauth: true,
    needsBranchSetup: !extraInfo?.branch || !extraInfo?.displayName || !extraInfo?.accessCode,
    accessCode: extraInfo?.accessCode,
    createdAt: Date.now(),
  };

  try {
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const existing = snap.data() as Account;
      const updated = {
        ...existing,
        displayName: user.displayName || existing.displayName,
        avatar: user.photoURL || existing.avatar,
        ...extraInfo,
      };
      if (!updated.branch || !updated.displayName || !updated.accessCode) {
        updated.needsBranchSetup = true;
      }
      try {
        await updateDoc(userRef, {
          ...updated,
          updatedAt: serverTimestamp(),
        });
      } catch (writeErr) {
        handleFirestoreError(writeErr, OperationType.UPDATE, path);
      }
      return updated;
    } else {
      try {
        await setDoc(userRef, {
          ...defaultAccount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (createErr) {
        handleFirestoreError(createErr, OperationType.CREATE, path);
      }
      return defaultAccount;
    }
  } catch (getErr) {
    handleFirestoreError(getErr, OperationType.GET, path);
    return defaultAccount;
  }
}

// Sign in with Google
export async function loginWithGoogle(): Promise<{ success: boolean; user?: Account; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const account = await syncUserProfileToFirestore(result.user);
    return { success: true, user: account };
  } catch (err: any) {
    console.error("Google sign in error:", err);
    return {
      success: false,
      error: err.code === "auth/popup-closed-by-user" 
        ? "تم إغلاق نافذة تسجيل الدخول" 
        : err.message || "فشل تسجيل الدخول بـ Google",
    };
  }
}

// Sign in using Email + Access Code
export async function loginWithEmailAndAccessCode(
  email: string,
  accessCode: string
): Promise<{ success: boolean; user?: Account; error?: string }> {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (accessCode || "").trim().toUpperCase();

    if (!cleanEmail || !cleanCode) {
      return { success: false, error: "الرجاء إدخال البريد الإلكتروني وكود الدخول الخاص بك" };
    }

    // 1. Query Firestore for user with matching email
    const usersCol = collection(db, "users");
    const q = query(usersCol, where("email", "==", cleanEmail));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userDoc = snap.docs[0];
      const data = userDoc.data() as Account;
      const userCode = (data.accessCode || "").trim().toUpperCase();

      if (userCode && userCode === cleanCode) {
        return { success: true, user: data };
      } else {
        return {
          success: false,
          error: "كود الدخول غير مطابق للبريد الإلكتروني المدخل. تأكد من صحة الكود أو سجل دخولك بحساب Google.",
        };
      }
    }

    return {
      success: false,
      error: "لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني. يرجى تسجيل الدخول بحساب Google أولاً.",
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, "users");
    return {
      success: false,
      error: err.message || "حدث خطأ أثناء فحص البيانات",
    };
  }
}

// Logout
export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error("Logout error:", err);
  }
}
