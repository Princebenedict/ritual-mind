import Link from "next/link";
import {Logo} from "@/components/icons";
import {buttonClass} from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="text-brand">
        <Logo size={40} />
      </span>
      <h1 className="mt-6 text-2xl font-bold">This page was not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The page you are looking for does not exist. Search for a wallet or return to the overview.
      </p>
      <Link href="/" className={buttonClass("brand", "mt-6")}>
        Back to home
      </Link>
    </div>
  );
}
