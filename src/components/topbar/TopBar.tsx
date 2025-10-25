import GlobalSearch from "./GlobalSearch";
import NotificationButton from "./NotificationButton";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const nav = useNavigate();

  return (
    <header className="h-16 border-b border-white/5 dark:border-white/5 px-6 flex items-center justify-between bg-white dark:bg-night-900 flex-shrink-0">
      <div className="flex-1 max-w-2xl">
        <GlobalSearch onNavigate={(href) => nav(href)} />
      </div>
      <div className="flex items-center gap-3 ml-6">
        <NotificationButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
