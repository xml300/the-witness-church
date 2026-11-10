import PublicPage from "@/src/components/pages/PublicPage";

export const metadata = {
  title: "Sermon Library",
  description: "Every message from The Witness Church.",
};

export default function Page() {
  return <PublicPage page="sermons" />;
}
