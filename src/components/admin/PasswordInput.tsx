"use client";
import { useState } from "react";

/** Password field with a show/hide toggle. Same attributes as a plain <input type="password">. */
export default function PasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input {...props} type={show ? "text" : "password"} style={{ paddingRight: 64, ...(props.style ?? {}) }} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, padding: "6px 8px", font: "inherit", fontSize: "1.2rem", fontWeight: 600, color: "#555", cursor: "pointer" }}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
