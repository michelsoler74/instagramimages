import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Asegurado que el layout principal importa el archivo global correcto

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Instagram Image Optimizer",
  description: "Optimiza tus imágenes para Instagram",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
