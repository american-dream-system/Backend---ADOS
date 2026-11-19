// One order for every admin-managed list (packages, tickets, featured items): an admin-set `order`
// number decides first (lowest first, items without one come last), then oldest first, then the id.
// The admin screen and the public pages use the same rule, so the list reads the same everywhere.
const orderOf = (doc) => {
    const n = doc && doc.order !== undefined && doc.order !== null && doc.order !== "" ? Number(doc.order) : NaN;
    return Number.isFinite(n) ? n : Infinity;
};

const compareAdminOrder = (a, b) => {
    const ao = orderOf(a);
    const bo = orderOf(b);
    if (ao !== bo) return ao < bo ? -1 : 1;
    const ta = new Date((a && a.createdAt) || 0).getTime();
    const tb = new Date((b && b.createdAt) || 0).getTime();
    if (ta !== tb) return ta - tb;
    return String((a && a._id) || "").localeCompare(String((b && b._id) || ""));
};

const sortAdminOrder = (list) => [...list].sort(compareAdminOrder);

module.exports = { sortAdminOrder, compareAdminOrder };
