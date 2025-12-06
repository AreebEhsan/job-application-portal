export default function Card({ className = "", ...props }) {
  // panel = light surface; default text should be dark and readable
  return <div className={`panel p-5 text-ink ${className}`} {...props} />;
}
