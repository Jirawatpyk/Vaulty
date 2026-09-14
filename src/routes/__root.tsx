import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { VaultHydrator } from "@/components/vault/hydrate";
import { LiveRegion } from "@/components/vault/live-region";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Vaulty";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "คลังมรดกและทรัพย์สินดิจิทัลส่วนบุคคล — Digital Legacy Vault",
      },
      { name: "theme-color", content: "#080c10" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Noto+Serif:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+Thai:wght@400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="th" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        <PreviewHostBridge />
        <AuthProvider>
          <VaultHydrator />
          <LiveRegion />
          <Outlet />
        </AuthProvider>
        <Toaster
          theme="dark"
          position="bottom-center"
          toastOptions={{
            className: "font-sans border-border bg-card text-foreground shadow-none hairline",
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
