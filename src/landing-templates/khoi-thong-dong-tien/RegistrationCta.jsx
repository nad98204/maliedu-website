import { useContext } from "react";
import { RegistrationContext } from "./registrationContext";
import { trackCtaClick } from "./ctaTracking";
import { scrollToRegistrationForm } from "./scrollToRegistration";

export default function RegistrationCta({ source, children, className = "", ...props }) {
  const registration = useContext(RegistrationContext);
  const Component = registration ? "button" : "a";

  return (
    <Component
      {...props}
      {...(registration
        ? { type: "button", "aria-haspopup": "dialog", "aria-controls": "leader-registration-dialog" }
        : { href: "#dang-ky" })}
      data-registration-source={source}
      className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9961A]`}
      onMouseEnter={registration?.preload}
      onFocus={registration?.preload}
      onTouchStart={registration?.preload}
      onClick={(event) => {
        event.preventDefault();
        trackCtaClick(source);
        if (registration) registration.open();
        else scrollToRegistrationForm();
      }}
    >
      {children}
    </Component>
  );
}
