import {
  Archive,
  Building2,
  Car,
  Gem,
  Globe,
  Hexagon,
  Landmark,
  LineChart,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { AssetCategory } from "@/lib/vault/types";

export const categoryIcon: Record<AssetCategory, LucideIcon> = {
  property: Building2,
  banking: Landmark,
  investment: LineChart,
  crypto: Hexagon,
  insurance: Shield,
  vehicle: Car,
  digital: Globe,
  collectible: Gem,
  other: Archive,
};
