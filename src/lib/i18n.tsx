import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const dict = {
  en: {
    brand: "Amira Made",
    home: "Home", products: "Products", categories: "Categories", deals: "Today's Deals",
    cart: "Cart", favorites: "Favorites", orders: "Orders", account: "Account", login: "Sign in", logout: "Sign out",
    search: "Search products, brands and categories",
    admin: "Admin", dashboard: "Dashboard",
    addToCart: "Add to cart", buyNow: "Buy now", outOfStock: "Out of stock", inStock: "In stock",
    price: "Price", discount: "Discount", quantity: "Quantity", description: "Description",
    name: "Name", phone: "Phone", address: "Address", paymentMethod: "Payment method", placeOrder: "Place order",
    cash: "Cash", cod: "Cash on delivery", visa: "Visa", mastercard: "Mastercard", instapay: "InstaPay",
    total: "Total", paid: "Paid", remaining: "Remaining",
    inventory: "Inventory", suppliers: "Suppliers", treasury: "Cashbox", reports: "Reports", banners: "Banners", invoices: "Invoices",
    sales: "Sales", purchases: "Purchases", profits: "Profits", expenses: "Expenses", visitors: "Visitors", users: "Users",
    add: "Add", edit: "Edit", delete: "Delete", save: "Save", cancel: "Cancel", actions: "Actions",
    welcome: "Welcome back", language: "Language", theme: "Theme",
    heroTitle: "Everything you need, delivered fast", heroSubtitle: "Discover unbeatable deals on millions of products.",
    shopNow: "Shop now", featured: "Featured products", newArrivals: "New arrivals",
    emptyCart: "Your cart is empty", emptyFavorites: "No favorites yet",
    email: "Email", password: "Password", username: "Username or Email", signUp: "Create account", noAccount: "New here?",
    haveAccount: "Already have an account?",
    confirmDelete: "Are you sure?", whatsappSupport: "WhatsApp support",
    lowStock: "Low stock", stock: "Stock",
    requireDeposit: "Pay a deposit before delivery",
    depositAmount: "Deposit amount",
    depositHint: "Pay part now, the rest on delivery.",
    deposit: "Deposit",
    coupons: "Coupons", coupon: "Coupon", couponCode: "Coupon code", apply: "Apply",
    promotions: "Promotions", promotion: "Promotion",
    ads: "Ads", ad: "Ad",
    customers: "Customers", broadcast: "Send messages",
    damaged: "Damaged / Lost", recordDamaged: "Record damaged item",
    parentCategory: "Parent category",
    addAccount: "Add account",
    deposit_action: "Deposit", withdraw_action: "Withdraw", transfer_action: "Transfer",
  },
  ar: {
    brand: "Amira Made",
    home: "الرئيسية", products: "المنتجات", categories: "الفئات", deals: "عروض اليوم",
    cart: "السلة", favorites: "المفضلة", orders: "الطلبات", account: "الحساب", login: "تسجيل الدخول", logout: "تسجيل الخروج",
    search: "ابحث عن المنتجات والعلامات التجارية والفئات",
    admin: "المسؤول", dashboard: "لوحة التحكم",
    addToCart: "أضف إلى السلة", buyNow: "اشترِ الآن", outOfStock: "غير متوفر", inStock: "متوفر",
    price: "السعر", discount: "خصم", quantity: "الكمية", description: "الوصف",
    name: "الاسم", phone: "رقم الهاتف", address: "العنوان", paymentMethod: "طريقة الدفع", placeOrder: "تأكيد الطلب",
    cash: "كاش", cod: "الدفع عند الاستلام", visa: "فيزا", mastercard: "ماستركارد", instapay: "إنستا باي",
    total: "الإجمالي", paid: "المدفوع", remaining: "المتبقي",
    inventory: "المخزون", suppliers: "الموردون", treasury: "الخزنة", reports: "التقارير", banners: "البانرات", invoices: "الفواتير",
    sales: "المبيعات", purchases: "المشتريات", profits: "الأرباح", expenses: "المصروفات", visitors: "الزوار", users: "المستخدمون",
    add: "إضافة", edit: "تعديل", delete: "حذف", save: "حفظ", cancel: "إلغاء", actions: "إجراءات",
    welcome: "مرحبًا بعودتك", language: "اللغة", theme: "الوضع",
    heroTitle: "كل ما تحتاجه يصل إليك بسرعة", heroSubtitle: "اكتشف عروضًا لا تقاوم على ملايين المنتجات.",
    shopNow: "تسوّق الآن", featured: "منتجات مميزة", newArrivals: "أحدث الوافدين",
    emptyCart: "سلتك فارغة", emptyFavorites: "لا توجد مفضلة بعد",
    email: "البريد الإلكتروني", password: "كلمة المرور", username: "اسم المستخدم أو البريد", signUp: "إنشاء حساب", noAccount: "جديد هنا؟",
    haveAccount: "لديك حساب بالفعل؟",
    confirmDelete: "هل أنت متأكد؟", whatsappSupport: "الدعم عبر واتساب",
    lowStock: "مخزون منخفض", stock: "المخزون",
    requireDeposit: "ادفع عربون قبل توصيل الطلب",
    depositAmount: "قيمة العربون",
    depositHint: "ادفع جزء الآن والباقي عند الاستلام.",
    deposit: "العربون",
    coupons: "الكوبونات", coupon: "كوبون", couponCode: "كود الكوبون", apply: "تطبيق",
    promotions: "العروض", promotion: "عرض",
    ads: "الإعلانات", ad: "إعلان",
    customers: "العملاء", broadcast: "إرسال رسائل",
    damaged: "الهالك والتالف", recordDamaged: "تسجيل صنف تالف",
    parentCategory: "القسم الأب",
    addAccount: "إضافة حساب",
    deposit_action: "إيداع", withdraw_action: "سحب", transfer_action: "تحويل",
  },
} as const;

type Dict = { [K in keyof typeof dict.en]: string };
type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; dir: "ltr" | "rtl" };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) || "en";
    setLangState(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  return (
    <I18nCtx.Provider value={{ lang, t: dict[lang], setLang, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
