import { FaPlaystation, FaWindows, FaXbox } from "react-icons/fa";
import { BsNintendoSwitch } from "react-icons/bs";
import { Gamepad2 } from "lucide-react";

export const PlatformIcon = ({
  platform,
  className = "w-4 h-4",
}: {
  platform: string;
  className?: string;
}) => {
  const name = platform?.toUpperCase() || "";
  if (name.includes("PC") || name.includes("WINDOWS")) {
    return <FaWindows className={className} aria-hidden />;
  }
  if (name.includes("PLAYSTATION") || name.includes("PS")) {
    return <FaPlaystation className={className} aria-hidden />;
  }
  if (name.includes("XBOX")) {
    return <FaXbox className={className} aria-hidden />;
  }
  if (name.includes("NINTENDO")) {
    return <BsNintendoSwitch className={className} aria-hidden />;
  }
  return <Gamepad2 className={className} aria-hidden />;
};
