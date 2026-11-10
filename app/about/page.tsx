import PublicPage from "@/src/components/pages/PublicPage";

export const metadata = {
  title: "About Us",
  description: "Who we are, what we believe, and where to find us online.",
};

export default function Page() {
  return <PublicPage page="about" />;
}
