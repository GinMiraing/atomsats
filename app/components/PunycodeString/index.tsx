import { useMemo } from "react";
import { toUnicode } from "tr46";

const PunycodeString: React.FC<{
  children: string;
  hiddenSame?: boolean;
}> = ({ children, hiddenSame }) => {
  const unicode = useMemo(() => {
    if (!children) return "";
    try {
      return children
        .split(".")
        .map((item) => {
          const { domain }: any = toUnicode(item);
          return domain;
        })
        .join(".");
    } catch (e) {
      return children;
    }
  }, [children]);

  return <>{hiddenSame ? (unicode == children ? null : children) : unicode}</>;
};

export default PunycodeString;
