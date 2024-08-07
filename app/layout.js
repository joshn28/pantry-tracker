import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../src/theme";
import CssBaseline from "@mui/material/CssBaseline";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pantry Tracker",
  description:
    "A pantry management application that allows users to keep track of pantry items by adding or removing items and updating their quantities.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
