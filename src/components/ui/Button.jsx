export function Button({ variant = "primary", className = "", ...props }) {
  const base = "btn " + (variant === "primary" ? "btn-primary" : "btn-ghost");
  return <button className={`${base} ${className}`} {...props} />;
}
