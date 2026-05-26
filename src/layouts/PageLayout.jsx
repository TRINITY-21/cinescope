/**
 * Standard page shell — clears fixed navbar and consistent bottom breathing room.
 */
export default function PageLayout({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`pt-20 sm:pt-24 pb-section-lg ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}
