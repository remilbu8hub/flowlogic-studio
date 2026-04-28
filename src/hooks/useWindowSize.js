import { useEffect, useState } from "react";

function getWindowSize() {
  if (typeof window === "undefined") {
    return { width: 1400, height: 900 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export default function useWindowSize() {
  const [size, setSize] = useState(getWindowSize);

  useEffect(() => {
    function handleResize() {
      setSize(getWindowSize());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}
