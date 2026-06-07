import { ListingGrid } from "@/components/listing-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vapor Engine | Marketplace",
  description: "Browse second-hand listings on Vapor Engine.",
};

export default function HomePage() {
  return <ListingGrid />;
}
