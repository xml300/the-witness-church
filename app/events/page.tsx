import PublicPage from "@/src/components/pages/PublicPage";

export const metadata = {
  title: "Celebrations & Events",
  description: "The Witness Church calendar of celebrations and events.",
};

export default function Page() {
  return <PublicPage page="events" />;
}
