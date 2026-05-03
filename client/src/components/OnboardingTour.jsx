import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { ONBOARDING_PENDING_KEY, ONBOARDING_TOUR_EVENT, translateOnboardingText } from "../utils/onboardingTour";

const MOBILE_QUERY = "(max-width: 760px)";

function userKey(user) {
  const id = user?.id || user?.email || "guest";
  return `planerka:onboarding:completed:${id}`;
}

function getTargetRect(selector) {
  const element = selector ? document.querySelector(selector) : null;
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    top: Math.max(8, rect.top - 8),
    left: Math.max(8, rect.left - 8),
    width: Math.min(window.innerWidth - 16, rect.width + 16),
    height: Math.min(window.innerHeight - 16, rect.height + 16),
  };
}

export default function OnboardingTour() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(MOBILE_QUERY).matches,
  );

  const desktopSteps = useMemo(
    () => [
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-header']",
        title: "Welcome to PLANERKA",
        body: "This is your home base. You can see what needs attention and jump into the work that matters today.",
        placement: "center",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-stats']",
        title: "Check your task pulse",
        body: "These cards show overdue work, today's tasks, weekly deadlines, and everything still open.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-courses']",
        title: "Keep courses close",
        body: "Your most useful courses appear here so class details, notes, and schedules stay easy to reach.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-actions']",
        title: "Use quick actions",
        body: "Start common workflows like creating courses, adding tasks, or opening the weekly planner.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-schedule']",
        title: "Watch your schedule",
        body: "Swipe or scroll to the schedule page to see courses, deadlines, and planned blocks together.",
      },
      {
        route: "/courses",
        selector: "[data-tour='nav-courses']",
        title: "Build your courses",
        body: "Courses are where class times, colors, notes, and course-specific work begin.",
      },
      {
        route: "/tasks",
        selector: "[data-tour='tasks-create']",
        title: "Capture tasks",
        body: "Use Tasks to add assignments, set deadlines, attach files, and mark work as done.",
      },
      {
        route: "/week",
        selector: "[data-tour='nav-daily']",
        title: "Plan the day",
        body: "Daily planning helps turn tasks and activities into a realistic schedule.",
      },
      {
        route: "/chat",
        selector: "[data-tour='nav-chat']",
        title: "Work with chat",
        body: "Chat keeps conversations and planning with classmates in the same workspace.",
      },
      {
        route: "/statistics",
        selector: "[data-tour='nav-statistics']",
        title: "Review progress",
        body: "Statistics shows trends in your tasks and study flow so you can adjust before things pile up.",
      },
      {
        route: "/settings",
        selector: "[data-tour='settings-replay-tour']",
        title: "Replay anytime",
        body: "You can restart this welcome tour from Settings whenever you want a quick refresher.",
      },
    ],
    [],
  );
  const mobileSteps = useMemo(
    () => [
      {
        route: "/dashboard",
        selector: "[data-tour='mobile-nav-home']",
        title: "Welcome to PLANERKA",
        body: "This bottom bar is your main mobile control center. Home brings you back to the dashboard.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-stats']",
        title: "Check today fast",
        body: "These numbers summarize overdue tasks, today's work, this week, and all open tasks.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-courses']",
        title: "Open your courses",
        body: "Your course shortcuts live here. Tap one to jump into notes, class times, and course tasks.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-mobile-tools']",
        title: "Use mobile shortcuts",
        body: "These buttons open quick course and action sheets without making you hunt around the page.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='dashboard-schedule']",
        title: "Swipe to schedule",
        body: "The dashboard slides sideways on mobile. Your schedule page shows courses, deadlines, and planned blocks.",
      },
      {
        route: "/courses",
        selector: "[data-tour='mobile-nav-courses']",
        title: "Courses tab",
        body: "Courses is where you create classes, add colors, and keep class details organized.",
      },
      {
        route: "/chat",
        selector: "[data-tour='mobile-nav-chat']",
        title: "Chat tab",
        body: "Chat keeps study conversations and planning with classmates close at hand.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='mobile-nav-assistant']",
        title: "Assistant tab",
        body: "Assistant opens your study helper from anywhere on mobile.",
      },
      {
        route: "/dashboard",
        selector: "[data-tour='mobile-nav-menu']",
        title: "More menu",
        body: "Menu holds the rest of the app, including tasks, daily planning, statistics, and settings.",
      },
      {
        route: "/tasks",
        selector: "[data-tour='tasks-create']",
        title: "Create tasks",
        body: "Use this button to capture assignments, due dates, files, and planned work time.",
      },
      {
        route: "/settings",
        selector: "[data-tour='settings-replay-tour']",
        title: "Replay anytime",
        body: "Settings lets you restart this mobile tour whenever you want a refresher.",
      },
    ],
    [],
  );

  const steps = isMobile ? mobileSteps : desktopSteps;

  const step = steps[stepIndex];
  const completedKey = userKey(user);
  const tourText = (value) => translateOnboardingText(language, value);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    function handleChange() {
      setIsMobile(media.matches);
      setStepIndex((current) => Math.min(current, (media.matches ? mobileSteps : desktopSteps).length - 1));
    }

    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [desktopSteps, mobileSteps]);

  useEffect(() => {
    function startTour() {
      if (!user) return;
      setStepIndex(0);
      setTargetRect(null);
      setActive(true);
    }

    window.addEventListener(ONBOARDING_TOUR_EVENT, startTour);
    return () => window.removeEventListener(ONBOARDING_TOUR_EVENT, startTour);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const pendingForUser = localStorage.getItem(`${ONBOARDING_PENDING_KEY}:${user.id || user.email}`);
    const pending = localStorage.getItem(ONBOARDING_PENDING_KEY) || pendingForUser;
    const completed = localStorage.getItem(completedKey);
    if (!pending || completed) return undefined;
    const timer = window.setTimeout(() => setActive(true), 0);
    return () => window.clearTimeout(timer);
  }, [completedKey, user]);

  useEffect(() => {
    if (!active || !step) return;
    if (location.pathname !== step.route) navigate(step.route, { replace: false });
  }, [active, location.pathname, navigate, step]);

  useEffect(() => {
    if (!active || !step) return undefined;

    let frame = 0;
    let timeout = 0;

    function syncTarget() {
      const element = step.selector ? document.querySelector(step.selector) : null;
      if (!element) {
        setTargetRect(null);
        return;
      }

      element.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
      window.requestAnimationFrame(() => {
        setTargetRect(getTargetRect(step.selector));
      });
    }

    timeout = window.setTimeout(() => {
      frame = window.requestAnimationFrame(syncTarget);
    }, 120);

    window.addEventListener("resize", syncTarget);
    window.addEventListener("scroll", syncTarget, true);
    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncTarget);
      window.removeEventListener("scroll", syncTarget, true);
    };
  }, [active, location.pathname, step]);

  function finish() {
    localStorage.setItem(completedKey, "1");
    localStorage.removeItem(ONBOARDING_PENDING_KEY);
    if (user?.id || user?.email) localStorage.removeItem(`${ONBOARDING_PENDING_KEY}:${user.id || user.email}`);
    setActive(false);
    setStepIndex(0);
    setTargetRect(null);
  }

  function next() {
    if (stepIndex >= steps.length - 1) {
      finish();
      return;
    }
    setStepIndex((current) => current + 1);
  }

  function back() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  if (!active || !step) return null;

  const spotlight = targetRect || {
    top: Math.round(window.innerHeight * 0.18),
    left: Math.round(window.innerWidth * 0.08),
    width: Math.round(window.innerWidth * 0.84),
    height: 120,
  };
  const isCenter = step.placement === "center" || !targetRect;
  const tooltipStyle = isCenter
    ? {}
    : {
        top:
          spotlight.top + spotlight.height + 18 < window.innerHeight - 220
            ? spotlight.top + spotlight.height + 18
            : Math.max(16, spotlight.top - 220),
        left: Math.min(Math.max(16, spotlight.left), window.innerWidth - 376),
      };

  return (
    <div className="onboarding-tour" role="dialog" aria-modal="true" aria-labelledby="onboarding-tour-title">
      <div className="onboarding-shade onboarding-shade-top" style={{ height: spotlight.top }} />
      <div className="onboarding-shade onboarding-shade-left" style={{ top: spotlight.top, width: spotlight.left, height: spotlight.height }} />
      <div
        className="onboarding-shade onboarding-shade-right"
        style={{ top: spotlight.top, left: spotlight.left + spotlight.width, height: spotlight.height }}
      />
      <div
        className="onboarding-shade onboarding-shade-bottom"
        style={{ top: spotlight.top + spotlight.height }}
      />
      <div className="onboarding-spotlight" style={spotlight} />

      <section className={"onboarding-card" + (isCenter ? " is-centered" : "")} style={tooltipStyle}>
        <div className="onboarding-count">
          {tourText("Step")} {stepIndex + 1} {tourText("of")} {steps.length}
        </div>
        <h2 id="onboarding-tour-title">{tourText(step.title)}</h2>
        <p>{tourText(step.body)}</p>
        <div className="onboarding-actions">
          <button type="button" className="btn btn-ghost" onClick={finish}>
            {tourText("Skip")}
          </button>
          <div className="onboarding-step-actions">
            <button type="button" className="btn btn-ghost" onClick={back} disabled={stepIndex === 0}>
              {tourText("Back")}
            </button>
            <button type="button" className="btn btn-primary" onClick={next}>
              {stepIndex >= steps.length - 1 ? tourText("Finish") : tourText("OK, next")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
