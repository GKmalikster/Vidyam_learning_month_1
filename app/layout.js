import "./globals.css";

export const metadata = {
  title: "Vidyam Learning Month",
  description: "A free learning month for everyone in our community.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
