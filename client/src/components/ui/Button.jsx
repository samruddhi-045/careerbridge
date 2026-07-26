export default function Button({ children, loading, variant = "solid", ...props }) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    solid: "bg-accent text-white hover:bg-accent/90 active:scale-[0.99]",
    ghost: "border border-line bg-white text-ink hover:border-ink/30",
  };

  return (
    <button className={`${base} ${styles[variant]}`} disabled={loading || props.disabled} {...props}>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      {children}
    </button>
  );
}