import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
      <p>
        Looking for deeper diligence? Read our{" "}
        <Link href="/y-combinator-alternatives" className="text-primary underline-offset-2 hover:underline">
          Y Combinator alternatives guide
        </Link>{" "}
        for check sizes, equity asks, and specialized cohorts.
      </p>
      <p className="mt-2">
        Need a solo-founder specific list? Browse{" "}
        <Link
          href="/alternatives-to-y-combinator-for-solo-founders"
          className="text-primary underline-offset-2 hover:underline"
        >
          alternatives to y combinator for solo founders
        </Link>{" "}
        with 100 options and source links.
      </p>
    </footer>
  );
}
