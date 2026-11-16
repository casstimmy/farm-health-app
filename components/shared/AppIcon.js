import {
  FaArchive,
  FaArrowDown,
  FaBaby,
  FaBell,
  FaBox,
  FaBoxes,
  FaBroom,
  FaBuilding,
  FaBullseye,
  FaCalendarAlt,
  FaCat,
  FaChartBar,
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaCog,
  FaCrown,
  FaDatabase,
  FaDog,
  FaEgg,
  FaEnvelope,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaFileInvoice,
  FaFish,
  FaGlobe,
  FaHardHat,
  FaHeart,
  FaHeartBroken,
  FaHome,
  FaKey,
  FaKiwiBird,
  FaLeaf,
  FaLightbulb,
  FaLock,
  FaMapMarkerAlt,
  FaMars,
  FaMoneyBillWave,
  FaNewspaper,
  FaNotesMedical,
  FaPalette,
  FaPaw,
  FaPills,
  FaPrescriptionBottle,
  FaReceipt,
  FaSatelliteDish,
  FaSearch,
  FaSeedling,
  FaShieldAlt,
  FaShoppingCart,
  FaStar,
  FaStickyNote,
  FaSyncAlt,
  FaSyringe,
  FaTag,
  FaTags,
  FaTasks,
  FaTimes,
  FaTimesCircle,
  FaTools,
  FaTrashAlt,
  FaUser,
  FaUserFriends,
  FaUserShield,
  FaUserTie,
  FaUsers,
  FaUsersCog,
  FaUtensils,
  FaVenus,
  FaWallet,
  FaWarehouse,
  FaWeight,
} from "react-icons/fa";
import {
  GiChicken,
  GiCow,
  GiDuck,
  GiGoat,
  GiHorseHead,
  GiPig,
  GiRabbit,
  GiSheep,
} from "react-icons/gi";

/**
 * The app's single icon set.
 *
 * Every icon on every screen comes from this list, by meaning rather than by
 * picture — so "location" is the same pin everywhere, a page header shows the
 * same icon as its menu entry, and changing one line here changes it app-wide.
 * (Previously screens mixed icon-font glyphs with emoji, which render
 * differently on every device and never lined up with the text.)
 */
export const ICONS = {
  // ── Navigation / pages ──────────────────────────────
  home: FaHome,
  tasks: FaTasks,
  expense: FaReceipt,
  animals: FaPaw,
  archive: FaArchive,
  health: FaNotesMedical,
  treatment: FaPills,
  breeding: FaHeart,
  mortality: FaHeartBroken,
  inventory: FaBoxes,
  categories: FaTags,
  loss: FaTrashAlt,
  services: FaTools,
  feed: FaLeaf,
  weight: FaWeight,
  management: FaUsersCog,
  users: FaUsers,
  roles: FaUserShield,
  finance: FaWallet,
  customers: FaUserFriends,
  orders: FaFileInvoice,
  reports: FaChartBar,
  setup: FaCog,
  location: FaMapMarkerAlt,
  business: FaBuilding,
  blog: FaNewspaper,
  seed: FaDatabase,

  // ── Status / feedback ───────────────────────────────
  success: FaCheckCircle,
  check: FaCheck,
  warning: FaExclamationTriangle,
  alert: FaExclamationCircle,
  error: FaTimesCircle,
  close: FaTimes,
  pending: FaClock,
  lock: FaLock,
  tip: FaLightbulb,
  offline: FaSatelliteDish,
  sync: FaSyncAlt,

  // ── Things ──────────────────────────────────────────
  money: FaMoneyBillWave,
  "trend-up": FaChartLine,
  "trend-down": FaArrowDown,
  chart: FaChartBar,
  target: FaBullseye,
  box: FaBox,
  tag: FaTag,
  list: FaClipboardList,
  note: FaStickyNote,
  file: FaFileAlt,
  calendar: FaCalendarAlt,
  search: FaSearch,
  eye: FaEye,
  email: FaEnvelope,
  bell: FaBell,
  cart: FaShoppingCart,
  globe: FaGlobe,
  paddock: FaWarehouse,
  vaccine: FaSyringe,
  supplies: FaPrescriptionBottle,
  meal: FaUtensils,
  cleaning: FaBroom,
  sprout: FaSeedling,
  star: FaStar,
  shield: FaShieldAlt,
  color: FaPalette,

  // ── People / roles ──────────────────────────────────
  user: FaUser,
  "role-superadmin": FaCrown,
  "role-subadmin": FaKey,
  "role-manager": FaUserTie,
  "role-attendant": FaHardHat,

  // ── Livestock ───────────────────────────────────────
  male: FaMars,
  female: FaVenus,
  pregnant: FaBaby,
  born: FaEgg,
  goat: GiGoat,
  cow: GiCow,
  sheep: GiSheep,
  pig: GiPig,
  chicken: GiChicken,
  horse: GiHorseHead,
  rabbit: GiRabbit,
  duck: GiDuck,
  turkey: FaKiwiBird,
  fish: FaFish,
  dog: FaDog,
  cat: FaCat,
};

const SPECIES_ICON = {
  goat: "goat",
  cattle: "cow",
  cow: "cow",
  sheep: "sheep",
  pig: "pig",
  swine: "pig",
  chicken: "chicken",
  poultry: "chicken",
  horse: "horse",
  donkey: "horse",
  rabbit: "rabbit",
  fish: "fish",
  turkey: "turkey",
  duck: "duck",
  dog: "dog",
  cat: "cat",
};

/** Icon name for a species ("Goat" -> "goat"); a paw for anything unknown. */
export function speciesIcon(species) {
  return SPECIES_ICON[String(species || "").toLowerCase().trim()] || "animals";
}

/**
 * <AppIcon name="location" />
 *
 * Sizes itself to the surrounding text (1em) and sits on the text baseline, so
 * it can be dropped in front of a label at any font size and stay aligned.
 * Pass a Tailwind size in className (e.g. "w-5 h-5") to override.
 */
export default function AppIcon({ name, className = "", title }) {
  const Icon = typeof name === "function" ? name : ICONS[name];
  if (!Icon) return null;
  return (
    <Icon
      aria-hidden={title ? undefined : true}
      title={title}
      className={`inline-block shrink-0 align-[-0.125em] ${className}`}
    />
  );
}
