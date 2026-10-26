import Link from "next/link";
export function SiteFooter() {
  return (
    <footer className="mt-12 space-y-4 border-t py-6 text-sm text-muted-foreground">
      <nav
        aria-label="More founder resources"
        className="flex flex-wrap gap-x-5 gap-y-3"
      >
        <Link href="/">Deadline calendar</Link>
        <Link href="/imported-accelerators">Program directory</Link>
        <Link href="/programs/upcoming-deadlines">Upcoming applications</Link>
        <Link href="/programs/rolling-applications">Rolling programs</Link>
        <Link href="/programs/ai">AI</Link>
        <Link href="/programs/europe">Europe</Link>
        <Link href="/programs/grants">Grants</Link>
        <Link href="/y-combinator-alternatives">YC alternatives</Link>
        <Link href="/alternatives-to-y-combinator-for-solo-founders">
          Solo-founder resources
        </Link>
        <Link href="/methodology">Research policy</Link>
      </nav>
      <p>
        Built by{" "}
        <a href="https://x.com/Web3Igor" className="underline">
          @Web3Igor
        </a>
        . Found an incorrect deadline?{" "}
        <a
          href="https://github.com/IgorShadurin/foundercal.org/issues/new?title=Data%20correction"
          className="underline"
        >
          Report a correction
        </a>
        .
      </p>
      <p>
        Independent research. Program names belong to their organizers.{" "}
        <Link href="/license" className="underline">
          Data license
        </Link>{" "}
        ·{" "}
        <a
          href="https://github.com/IgorShadurin/foundercal.org"
          className="underline"
        >
          Source code
        </a>
      </p>
    </footer>
  );
}
