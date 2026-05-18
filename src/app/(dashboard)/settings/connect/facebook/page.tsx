import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeOAuthCookieData } from "@/lib/oauth";
import { FacebookPagePicker } from "@/components/settings/facebook-page-picker";

interface FbPage {
  id: string;
  name: string;
  instagram_business_account?: { id: string; name: string; username: string };
}

interface OAuthFbData {
  pages: FbPage[];
  businessId: string;
}

export default async function FacebookConnectPage() {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get("oauth_fb_data")?.value;
  if (!cookieVal) redirect("/settings?tab=integrations");

  const data = decodeOAuthCookieData<OAuthFbData>(cookieVal);
  if (!data || !data.pages?.length) redirect("/settings?tab=integrations");

  return (
    <div className="p-6 max-w-lg mx-auto animate-fade-in">
      <div className="mb-6">
        <a
          href="/settings?tab=integrations"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Settings
        </a>
        <h2 className="text-xl font-semibold mt-3">Select a Facebook Page</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose which page to connect to this business.
          {data.pages.some((p) => p.instagram_business_account) &&
            " Instagram Business will connect automatically if linked."}
        </p>
      </div>
      <FacebookPagePicker pages={data.pages} />
    </div>
  );
}
