export default function Card({ className = "", ...props }) {
  return <div className={`panel p-5 ${className}`} {...props} />;
}
