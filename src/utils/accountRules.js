// The sign-up rules, in one place, for the account screens (edit personal information, change password).
// Sign-up (modules/auth/validator.js) enforces the same: name 3+ characters, an Egyptian mobile number
// (010 / 011 / 012 / 015 + 8 digits), age required, gender male | female, password 6+ characters.

// Phone formatting is the one login uses: spaces removed, +20... and 20... become 01...
const normalizePhone = (value) => {
    let v = String(value === undefined || value === null ? "" : value).trim().replace(/\s+/g, "");
    if (v.startsWith("+20")) v = "0" + v.slice(3);
    else if (/^20\d{10}$/.test(v)) v = "0" + v.slice(2);
    return v;
};

const PHONE_RE = /^(010|011|012|015)[0-9]{8}$/;
const NAME_MIN = 3;
const PASSWORD_MIN = 6;

const MSG = {
    name: "يجب ألا يقل الاسم عن 3 أحرف / The name must be at least 3 characters",
    phone: "يجب إدخال رقم هاتف مصري صالح (11 رقم) / Enter a valid Egyptian mobile number (11 digits)",
    age: "العمر مطلوب / Age is required",
    gender: "النوع يجب أن يكون ذكر أو أنثى / Gender must be male or female",
    passwordShort: "كلمة المرور يجب ألا تقل عن 6 أحرف / The password must be at least 6 characters",
    passwordMismatch: "تأكيد كلمة المرور غير متطابق / The confirmation does not match",
    passwordSame: "كلمة المرور الجديدة يجب أن تختلف عن الحالية / The new password must be different from the current one",
    currentRequired: "كلمة المرور الحالية مطلوبة / The current password is required",
    currentWrong: "كلمة المرور الحالية غير صحيحة / The current password is not correct",
    phoneTaken: "رقم الهاتف مسجل بالفعل / This phone number is already registered",
    nothing: "لا توجد تغييرات للحفظ / Nothing to change"
};

module.exports = { normalizePhone, PHONE_RE, NAME_MIN, PASSWORD_MIN, MSG };
