"use client"
import FloodFill from "../src/floodfill"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <FloodFill />
    </main>
  );
}
