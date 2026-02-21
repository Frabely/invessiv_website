export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="bg-white text-slate-900">{children}</main>;
}
