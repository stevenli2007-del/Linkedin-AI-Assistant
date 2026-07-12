// Profile Extractor — reads visible LinkedIn profile data from the DOM
// Phase 2: Robust extraction with multiple fallback selectors + retry

import type { TargetProfile } from "@/types";

const LINKEDIN_PROFILE_HOSTS = ["www.linkedin.com", "linkedin.com"];
const LINKEDIN_PROFILE_PATH_PATTERN = /^\/in\/[\w\-]+/;

const TAG = "[LinkedIn AI]";

function warn(...args: unknown[]): void {
  console.warn(TAG, ...args);
}

/**
 * Debug logging is compiled out in production builds.
 * All `debug()` calls below are no-ops — they exist in source for
 * development troubleshooting but emit nothing at runtime.
 */
function debug(..._args: unknown[]): void {
  // Intentional no-op. Override in development by replacing
  // this function at runtime if needed.
}

/**
 * Check whether the current page is a LinkedIn profile page.
 */
export function isLinkedInProfilePage(): boolean {
  try {
    const url = new URL(window.location.href);
    const isValidHost = LINKEDIN_PROFILE_HOSTS.includes(url.hostname);
    const isValidPath = LINKEDIN_PROFILE_PATH_PATTERN.test(url.pathname);
    return isValidHost && isValidPath;
  } catch {
    return false;
  }
}

/**
 * Remove extra whitespace and common LinkedIn UI noise.
 */
function cleanText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/\s+/g, " ")
    // LinkedIn UI action buttons (Chinese & English)
    .replace(/建立關係/gi, "")
    .replace(/发消息/gi, "")
    .replace(/\bConnect\b/gi, "")
    .replace(/\bFollow\b/gi, "")
    .replace(/\bMessage\b/gi, "")
    .replace(/More\.\.\./gi, "")
    // Connection degree indicators (e.g. "2 度", "3rd+ degree", "· 2 度")
    .replace(/\d+\s*度\s*/g, "")
    .replace(/\d+(?:st|nd|rd|th)\+?\s*degree\s*/gi, "")
    .replace(/·\s*\d+(?:st|nd|rd|th)?\s*/gi, "· ")
    // LinkedIn UI expand/collapse
    .replace(/\s\.{3}\s*Show more\s*\.\.\./gi, "")
    .replace(/\.{3}\s*Show more/gi, "")
    .replace(/Show more/gi, "")
    .replace(/Show less/gi, "")
    .replace(/Contact info/gi, "")
    // Remove leftover leading/trailing separators and whitespace
    .replace(/^[·\s,]+/g, "")
    .replace(/[·\s,]+$/g, "")
    .trim();
}

/**
 * Try a list of selectors and return the text content of the first match.
 */
function extractTextBySelectors(
  selectors: string[],
  container: Document | Element = document
): string {
  for (const selector of selectors) {
    try {
      const element = container.querySelector(selector);
      if (element) {
        const text = cleanText(element.textContent);
        if (text) return text;
      }
    } catch (e) {
      console.warn(`[LinkedIn AI Assistant] Invalid selector: ${selector}`, e);
    }
  }
  return "";
}

/**
 * Wait for the DOM to settle. LinkedIn is a heavy SPA, so the profile data
 * may arrive slightly after document_idle.
 */
function waitForElement(
  selector: string,
  timeoutMs: number = 3000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeoutMs);

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/**
 * Extract a section by its id, aria-label, or heading text.
 * Only matches heading-level elements (h2, h3) to avoid false
 * positives from body text containing label keywords (e.g. a degree
 * named "Bachelor of Education").
 */
function findSectionByIdOrLabel(
  sectionId: string,
  labelKeywords: string[]
): Element | null {
  // Try id first
  const byId = document.getElementById(sectionId);
  if (byId) {
    debug(`findSection: #${sectionId} found via getElementById`);
    return byId;
  }

  // Try section with aria-label matching keywords
  const sections = document.querySelectorAll("section, div");
  for (const section of sections) {
    const ariaLabel = section.getAttribute("aria-label")?.toLowerCase() || "";
    if (labelKeywords.some((keyword) => ariaLabel.includes(keyword))) {
      debug(`findSection: matched aria-label for "${labelKeywords.join(",")}"`);
      return section;
    }
  }

  // Try heading text matching — only h2/h3, never span
  const headings = document.querySelectorAll("h2, h3");
  for (const heading of headings) {
    const text = (heading.textContent || "").toLowerCase().trim();
    if (labelKeywords.some((keyword) => text.includes(keyword))) {
      // Walk up to the nearest meaningful container (SECTION, or a DIV with several children).
      let parent: Element | null = heading.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName === "SECTION" || parent.children.length > 3) {
          debug(`findSection: matched heading "${text}" for "${labelKeywords.join(",")}"`);
          return parent;
        }
        parent = parent.parentElement;
      }
      debug(`findSection: matched heading "${text}" but no good parent, returning parentElement`);
      return heading.parentElement;
    }
  }

  debug(`findSection: NOT FOUND for ${sectionId} / [${labelKeywords.join(",")}]`);
  return null;
}

/**
 * Extract the first meaningful text block from a section.
 * Avoids profile header elements (h1, name cards) and action buttons.
 */
function extractFirstTextBlock(section: Element | null): string {
  if (!section) return "";

  // Prefer elements with inline-show-more-text
  const showMoreElements = section.querySelectorAll(".inline-show-more-text");
  for (const element of showMoreElements) {
    const text = cleanText(element.textContent);
    if (text && text.length > 15) {
      return text;
    }
  }

  // Then try text-heavy elements, but skip profile header / action areas
  const textElements = section.querySelectorAll(
    ".display-flex, p, span, div"
  );
  for (const element of textElements) {
    // Skip elements inside profile header, action buttons, or navigation
    if (
      element.closest("h1, [role='banner'], button, nav, .artdeco-dropdown")
    ) {
      continue;
    }
    const text = cleanText(element.textContent);
    if (text && text.length > 15) {
      return text;
    }
  }

  // Fallback: use the section's own text
  return cleanText(section.textContent);
}

/**
 * Check if an element is likely to contain the profile name.
 * Used as a heuristic for LinkedIn 2024+ layouts where h1 doesn't exist.
 */
function looksLikeName(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  return (
    t.length >= 2 &&
    t.length <= 60 &&
    !/\d/.test(t) &&
    !/^(home|linkedin|search|notifications|messaging|jobs|me|view profile|sign in|join|my network|我的人脈|刊登廣告|發消息)/i.test(t)
  );
}

function extractName(): string {
  // Ordered from most specific to least specific.
  // LinkedIn 2024+ sometimes doesn't use h1 for names!
  const result = extractTextBySelectors([
    '[data-testid="profile-name"]',
    // Modern LinkedIn heading classes
    "h1.text-heading-xlarge",
    "h1.text-heading-xlarge-inline",
    "h1.heading-xlarge",
    // Older LinkedIn classes
    "h1.inline.t-24.t-black.t-normal.break-words",
    "h1.t-24.t-black.t-normal.break-words",
    "h1.text-heading-large",
    // Layout-based fallbacks
    ".pv-text-details__left-panel h1",
    ".top-card-layout__card h1",
    ".profile-card-content h1",
    "main h1",
    "h1",
    // LinkedIn 2024+ might use h2 for the name
    ".pv-text-details__left-panel h2",
    ".top-card-layout__card h2",
    "main h2.text-heading-xlarge",
    "main h2:first-of-type",
  ]);

  if (result) return result;

  // Last resort: scan for any element that looks like a name at the top of the page
  const mainContent = getMainContentContainer();
  if (mainContent) {
    const candidates = mainContent.querySelectorAll("h2, h3, span, div");
    for (const el of candidates) {
      if (isNavigationElement(el)) continue;
      const text = cleanText(el.textContent);
      if (looksLikeName(text)) {
        debug(`extractName: heuristic found "${text}" via ${el.tagName}.${el.className.slice(0, 30)}`);
        return text;
      }
    }
  }

  return "";
}

function extractHeadline(): string {
  const selectors = [
    '[data-testid="profile-headline"]',
    "div.text-body-medium.break-words",
    "span.text-body-medium.break-words",
    "div.text-body-medium.t-black--light",
    "span.text-body-medium.t-black--light",
    ".pv-text-details__left-panel .text-body-medium",
    "div.text-body-medium",
    // Modern LinkedIn selectors (2024+)
    "main .t-16.t-black--light",
    "main .text-body-medium",
    '[class*="headline"]',
    // LinkedIn 2024+ Chinese version selectors
    "main span.t-16",
    "main .text-body-small",
    '[class*="ph5"] span',
  ];

  const mainContent = getMainContentContainer();

  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el && !isNavigationElement(el)) {
        const text = cleanText(el.textContent);
        if (text) {
          debug(`headline: matched "${sel}" → "${text}"`);
          return text;
        }
      }
    } catch {
      // bad selector, skip
    }
  }

  // Fallback: find text that looks like a headline near the profile name area
  // LinkedIn 2024+ often uses a different structure.
  // Scan the top portion of the page for short descriptive text.
  if (mainContent) {
    const topTexts = mainContent.querySelectorAll("span, div");
    for (const el of topTexts) {
      if (isNavigationElement(el)) continue;
      const text = cleanText(el.textContent);
      const name = cleanText(document.querySelector("[data-testid='profile-name'], .text-heading-xlarge, h1, h2")?.textContent);
      // Headline is typically: 10-150 chars, not the name, not a heading
      if (
        text &&
        text.length > 10 &&
        text.length < 200 &&
        text !== name &&
        !/^[A-Za-z\s]{2,40}$/.test(text) // Not likely to be just a name
      ) {
        debug(`headline: fallback scan → "${text}"`);
        return text;
      }
    }
  }

  warn("headline: NOT FOUND");
  return "";
}

function extractLocation(): string {
  return extractTextBySelectors([
    '[data-testid="profile-location"]',
    "span.text-body-small.inline.t-black--light.break-words",
    "span.t-black--light.break-words",
    "span.text-body-small.t-black--light",
    ".pv-text-details__left-panel .text-body-small",
  ]);
}

function extractAbout(): string {
  const mainContent = getMainContentContainer();

  // Strategy 1: LinkedIn anchors sections with stable IDs (old layout)
  for (const id of ["about", "about-section"]) {
    const el = mainContent?.querySelector(`#${id}`) || document.getElementById(id);
    if (el) {
      const parent = el.closest("section") || el.parentElement;
      if (parent && !isNavigationElement(parent)) {
        const text = extractFirstTextBlock(parent);
        if (text) {
          debug(`about: found via #${id} → "${text.slice(0, 80)}..."`);
          return text;
        }
      }
    }
  }

  // Strategy 2: Find by heading text (h2 section title "About")
  const headings = mainContent?.querySelectorAll("h2, h3") || document.querySelectorAll("h2, h3");
  for (const h of headings) {
    if (isNavigationElement(h)) continue;
    const ht = (h.textContent || "").toLowerCase().trim();
    if (ht === "about" || ht.includes("about")) {
      // Walk up to the section container
      let parent: Element | null = h.parentElement;
      while (parent && parent !== document.body && parent !== mainContent?.parentElement) {
        if (parent.tagName === "SECTION" || (parent.tagName === "DIV" && parent.children.length > 2)) {
          const text = extractFirstTextBlock(parent);
          if (text && !isNavigationElement(parent)) {
            debug(`about: found via h2/h3 match → "${text.slice(0, 80)}..."`);
            return text;
          }
        }
        parent = parent.parentElement;
      }
    }
  }

  // Strategy 3: Any .inline-show-more-text in main content area
  if (mainContent) {
    const showMores = mainContent.querySelectorAll(".inline-show-more-text, [class*='show-more']");
    debug(`about: found ${showMores.length} show-more elements in main`);
    for (const el of showMores) {
      if (isNavigationElement(el)) continue;
      const text = cleanText(el.textContent);
      if (text && text.length > 20) {
        debug(`about: via show-more → "${text.slice(0, 80)}..."`);
        return text;
      }
    }
  }

  // Strategy 4: Scan for any large text block after the profile header
  // In LinkedIn 2024+, the About section typically has a paragraph of text
  if (mainContent) {
    const largeTexts = mainContent.querySelectorAll("p, span, div");
    for (const el of largeTexts) {
      if (isNavigationElement(el)) continue;
      const text = cleanText(el.textContent);
      // About text is typically longer (50+ chars) and not a heading
      if (text && text.length > 50 && text.length < 3000 && !text.includes("view profile in a new tab")) {
        debug(`about: found large text block → "${text.slice(0, 80)}..."`);
        return text;
      }
    }
  }

  // Strategy 5: Fall back to old findSectionByIdOrLabel
  const aboutSection = findSectionByIdOrLabel("about", ["about"]);
  if (aboutSection && !isNavigationElement(aboutSection)) {
    const text = extractFirstTextBlock(aboutSection);
    if (text) {
      debug(`about: via findSectionByIdOrLabel → "${text.slice(0, 80)}..."`);
      return text;
    }
  }

  warn("about: NOT FOUND");
  return "";
}

/**
 * Find a content section by its heading text. Scans the entire document
 * (not just main) but excludes nav/footer. Returns the parent container.
 */
function findSectionByHeading(keywords: string[]): Element | null {
  // Scan ALL sections and div containers looking for matching headings
  const containers = document.querySelectorAll("section, div");

  for (const container of containers) {
    if (isNavigationElement(container)) continue;

    // Check if this container has a heading matching our keywords
    const heading = container.querySelector("h2, h3");
    if (heading) {
      const text = (heading.textContent || "").toLowerCase().trim();
      if (keywords.some((kw) => text.includes(kw))) {
        // Verify it actually contains content (li or substantial text)
        const liCount = container.querySelectorAll("li").length;
        if (liCount >= 1 || container.textContent!.length > 100) {
          debug(`findSectionByHeading: found section "${text}" with ${liCount} li`);
          return container;
        }
      }
    }
  }

  // Fallback: any section with substantial li content (for when LinkedIn uses
  // different heading text e.g. locale-specific labels)
  for (const section of document.querySelectorAll("section")) {
    if (isNavigationElement(section)) continue;
    const liCount = section.querySelectorAll("li").length;
    if (liCount >= 2) {
      debug(`findSectionByHeading: fallback — found section with ${liCount} li`);
      return section;
    }
  }

  debug(`findSectionByHeading: NOT FOUND for ${keywords.join(", ")}`);
  return null;
}

function extractExperience(): string {
  // Strategy 1: Find section by heading (scans entire document, not just main)
  let container = findSectionByHeading(["experience", "工作经历"]);

  // Strategy 2: Fall back to main content area
  if (!container) {
    const mainContent = getMainContentContainer();
    debug("experience: trying main content area");
    container = mainContent || document.body;
  }

  const entries: string[] = [];

  // ALL possible selectors for LinkedIn experience items
  const itemSelectors = [
    "li.pvs-list__item",
    ".pvs-entity",
    ".pvs-list__container li",
    "div.display-flex.pv2",
    ".experience-item",
    ".pv-entity__position-group",
    ".pv-entity__summary-info",
    "section li",
    "div li:has(span:not(.sr-only))",
    "li",
  ];

  for (const sel of itemSelectors) {
    const items = container.querySelectorAll(sel);
    debug(`experience: selector "${sel}" → ${items.length} items`);
    for (const item of items) {
      if (isNavigationElement(item)) continue;
      if (item.closest("nav, [role='banner'], #profile-tab-container")) continue;
      if (item.querySelector("button:not(.inline-show-more-text), a[role='button'], .artdeco-dropdown")) continue;
      const text = cleanText(item.textContent);
      if (text && text.length > 8 && !entries.includes(text)) {
        entries.push(text);
      }
    }
    if (entries.length > 0) break;
  }

  if (entries.length > 0) {
    debug(`experience: extracted ${entries.length} entries`);
    return entries.join("\n---\n");
  }

  // Last resort: if container has text, grab it
  const text = cleanText(container.textContent);
  if (text && text.length > 10) {
    debug(`experience: fallback section text → "${text.slice(0, 80)}..."`);
    return text.slice(0, 2000); // cap at 2000 chars
  }

  warn("experience: NOT FOUND");
  return "";
}

function extractEducation(): string {
  // Strategy 1: Find section by heading (scans entire document)
  let container = findSectionByHeading(["education", "教育"]);

  // Strategy 2: Fall back to main content area
  if (!container) {
    const mainContent = getMainContentContainer();
    debug("education: trying main content area");
    container = mainContent || document.body;
  }

  if (isNavigationElement(container)) {
    debug("education: container is navigation, trying main content instead");
    container = getMainContentContainer() || document.body;
  }

  const schools: string[] = [];

  const candidateSelectors = [
    "li.pvs-list__item",
    ".pvs-entity",
    ".pvs-list__container li",
    ".education__item",
    ".pv-entity__summary-info",
    "[data-view-name='profile-education'] li",
    "section li",
    "li:has(span:not(.sr-only))",
    "li",
  ];

  for (const sel of candidateSelectors) {
    const candidates = container.querySelectorAll(sel);
    debug(`education: selector "${sel}" → ${candidates.length} candidates`);
    for (const candidate of candidates) {
      if (isNavigationElement(candidate)) continue;
      if (candidate.closest("nav, [role='banner'], #profile-tab-container")) continue;
      if (candidate.querySelector("button, a[role='button'], .artdeco-dropdown")) continue;

      // Try dedicated school-name elements
      const schoolSpan = candidate.querySelector(
        ".pv-entity__school-name, [class*='school-name'], span[class*='school'], .t-bold span, .t-16.t-bold, span[aria-hidden='true']"
      );
      if (schoolSpan) {
        const name = cleanText(schoolSpan.textContent);
        if (name && name.length > 2 && name.length < 120 && !schools.includes(name)) {
          const navPattern = /^(?:home|linkedin|search|notifications|messaging|jobs|我的人脈|刊登廣告|premium|upgrade|view profile|sign in|join)/i;
          if (!navPattern.test(name)) {
            debug(`education: found school "${name}" via schoolSpan`);
            schools.push(name);
            continue;
          }
        }
      }

      const rawText = cleanText(candidate.textContent);
      if (rawText && rawText.length > 2 && rawText.length < 150 && !schools.includes(rawText)) {
        const navPattern = /^(home|linkedin|search|notifications|messaging|jobs|about|experience|education|skills|interests|activity|我的人脈|刊登廣告|premium|upgrade|sign in|join|member|follower|view profile in a new tab|saved items|invitations|try premium|people you may know|groups|events|hashtags)/i;
        if (!navPattern.test(rawText)) {
          schools.push(rawText);
        }
      }
    }
    if (schools.length > 0) break;
  }

  if (schools.length === 0 && container && container !== document.body) {
    const fallback = extractFirstTextBlock(container);
    if (fallback) {
      debug(`education: fallback text → "${fallback.slice(0, 80)}..."`);
      return fallback;
    }
  }

  if (schools.length === 0) {
    warn("education: NOT FOUND");
    return "";
  }

  debug(`education: extracted ${schools.length} schools: ${schools.join(" | ")}`);
  return schools.join(", ");
}

function extractCompanyFromHeadline(headline: string): string {
  if (!headline) return "";

  const patterns = [
    /(?:at|@)\s+([A-Za-z0-9\s&.,'-]+?)(?:\s+\||\s+·|\s+\(|$)/i,
    /(?:at|@)\s+([A-Za-z0-9\s&.,'-]+)$/i,
  ];
  for (const pattern of patterns) {
    const match = headline.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
}

function extractCompanyFromExperience(experience: string): string {
  if (!experience) return "";

  const patterns = [
    /(?:at|@)\s+([A-Za-z0-9\s&.,'-]+?)(?:\s+·|\s+\(|$)/i,
    /(?:at|@)\s+([A-Za-z0-9\s&.,'-]+)$/i,
  ];
  for (const pattern of patterns) {
    const match = experience.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // LinkedIn experience items often list company name on a separate line.
  // Try the first line if it looks like a company name.
  const firstLine = experience.split("\n")[0]?.trim();
  if (firstLine && firstLine.length < 80) {
    return firstLine;
  }

  return "";
}

function extractCompany(headline: string, experience: string): string {
  const fromHeadline = extractCompanyFromHeadline(headline);
  if (fromHeadline) return fromHeadline;

  const fromExperience = extractCompanyFromExperience(experience);
  if (fromExperience) return fromExperience;

  return "";
}

/**
 * Last-resort heuristic: scan the top portion of the page for a short,
 * name-like text. Useful when LinkedIn uses obfuscated class names.
 */
function extractNameHeuristic(): string {
  // Look for headings near the top of main/scaffold-layout__main content.
  const candidates = document.querySelectorAll(
    "main h1, main h2, .scaffold-layout__main h1, .scaffold-layout__main h2, [class*='profile-card'] h1"
  );

  for (const element of candidates) {
    const text = cleanText(element.textContent);
    // A name is usually 2-40 chars, no digits, no common UI words.
    if (
      text &&
      text.length >= 2 &&
      text.length <= 40 &&
      !/\d/.test(text) &&
      !/^(home|linkedin|search|notifications|messaging|jobs)$/i.test(text)
    ) {
      return text;
    }
  }

  return "";
}

/**
 * Extract target profile information from the current LinkedIn page.
 * Returns a TargetProfile with all fields populated when possible.
 */
export function extractTargetProfile(): TargetProfile {
  if (!isLinkedInProfilePage()) {
    throw new Error(
      "This page does not look like a LinkedIn profile page. Please open a profile at https://www.linkedin.com/in/..."
    );
  }

  const profile: TargetProfile = {
    targetName: "",
    targetHeadline: "",
    targetSchool: "",
    targetCompany: "",
    targetLocation: "",
    targetAbout: "",
    targetExperience: "",
  };

  try {
    profile.targetName = extractName() || extractNameHeuristic();
    profile.targetHeadline = extractHeadline();
    profile.targetLocation = extractLocation();
    profile.targetAbout = extractAbout();
    profile.targetExperience = extractExperience();
    profile.targetSchool = extractEducation();
    profile.targetCompany = extractCompany(
      profile.targetHeadline,
      profile.targetExperience
    );
  } catch (error) {
    console.warn("[LinkedIn AI Assistant] Extraction warning:", error);
  }

  if (!profile.targetName) {
    throw new Error(
      "Could not extract the profile name. LinkedIn may have changed its page layout. Please try refreshing the page."
    );
  }

  return profile;
}

/**
 * Aggressive scroll-to-bottom to trigger LinkedIn's lazy rendering.
 * LinkedIn 2024+ layout requires scrolling much further to load sections.
 * We continue scrolling until page height stops changing.
 */
async function triggerLazyLoad(): Promise<void> {
  // Named timeouts for lazy-load scrolling (extracted from magic numbers)
  const SCROLL_STEP_WAIT_MS = 400;   // Wait after each scroll increment for content to load
  const FINAL_SCROLL_WAIT_MS = 800;  // Wait after scrolling to absolute bottom
  const SCROLL_TO_TOP_WAIT_MS = 600; // Wait after scrolling back to top before extraction

  debug("triggerLazyLoad: starting scroll to trigger lazy render...");

  // Store initial height
  let lastHeight = document.body.scrollHeight;
  let scrollY = 0;
  let attempts = 0;
  const maxAttempts = 50; // Prevent infinite loop

  // Phase 1: Scroll down continuously until height stops changing
  while (attempts < maxAttempts) {
    // Scroll down by viewport height (small increments work better)
    scrollY += Math.min(window.innerHeight * 0.8, 500);
    window.scrollTo(0, scrollY);

    // Wait for any lazy loading to happen
    await new Promise((r) => window.setTimeout(r, SCROLL_STEP_WAIT_MS));

    // Check if page height changed (content loaded)
    const newHeight = document.body.scrollHeight;
    if (newHeight !== lastHeight) {
      debug(`triggerLazyLoad: height changed ${lastHeight} → ${newHeight}, continuing...`);
      lastHeight = newHeight;
      attempts = 0; // Reset counter since we're still loading
      continue;
    }

    attempts++;

    // If we've reached the bottom, break
    if (scrollY >= lastHeight - window.innerHeight) {
      debug("triggerLazyLoad: reached bottom of page");
      break;
    }
  }

  // Phase 2: One final scroll to absolute bottom
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise((r) => window.setTimeout(r, FINAL_SCROLL_WAIT_MS));

  // Phase 3: Scroll back to top for extraction
  window.scrollTo(0, 0);
  await new Promise((r) => window.setTimeout(r, SCROLL_TO_TOP_WAIT_MS));

  debug("triggerLazyLoad: completed");
}

/**
 * Get the main content container, excluding header nav and footer.
 * This prevents extraction from grabbing nav/footer items.
 */
function getMainContentContainer(): Element | null {
  // Try modern LinkedIn selectors for main content area
  const selectors = [
    "main.scaffold-layout__main",
    "main",
    ".scaffold-layout__main",
    "#main",
    '[data-testid="profile-main-content"]',
    ".profile-content",
    "article", // Sometimes content is wrapped in article
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      debug(`getMainContentContainer: found via "${sel}"`);
      return el;
    }
  }

  // Fallback: return body but we'll filter later
  debug("getMainContentContainer: no specific main container found, using body");
  return document.body;
}

/**
 * Check if an element is likely a navigation or footer element.
 * Used to filter out LinkedIn UI chrome.
 */
function isNavigationElement(el: Element): boolean {
  // Check if element or any ancestor is clearly nav/footer
  const isNav = el.closest("nav, footer, [role='navigation'], [role='contentinfo']");
  if (isNav) return true;

  // Check for footer-specific classes or attributes
  const footerClasses = /footer|bottom-nav|global-nav|site-nav|tab-bar/i;
  const parent = el.parentElement;
  if (parent && footerClasses.test(parent.className || "")) return true;

  // Check if element contains only navigation text
  const text = el.textContent?.toLowerCase().trim() || "";
  const navTexts = [
    "home", "linkedin", "search", "notifications", "messaging", "jobs",
    "我的人脈", "刊登廣告", "發消息", "建立關係", "connect", "follow", "message",
    "my network", "advertise", "premium", "upgrade",
  ];
  if (navTexts.includes(text)) return true;

  return false;
}

/**
 * Async wrapper that waits for the name to appear in the DOM,
 * scrolls to trigger lazy-loaded sections, then extracts.
 * LinkedIn sometimes renders profile data after document_idle.
 */
export async function extractTargetProfileAsync(): Promise<TargetProfile> {
  if (!isLinkedInProfilePage()) {
    throw new Error(
      "This page does not look like a LinkedIn profile page. Please open a profile at https://www.linkedin.com/in/..."
    );
  }

  // Wait up to 5 seconds for the name to appear.
  // LinkedIn 2024+ may not use h1 — try multiple selectors including h2.
  const nameSelectors = [
    '[data-testid="profile-name"]',
    "h1.text-heading-xlarge",
    "h2.text-heading-xlarge",
    "h1.inline.t-24.t-black.t-normal.break-words",
    "main h1",
    "main h2.text-heading-xlarge",
    "main h2",
    "h1",
    "h2",
  ];

  let foundName = "";
  for (const selector of nameSelectors) {
    debug(`extractTargetProfileAsync: waiting for "${selector}"...`);
    const element = await waitForElement(selector, 5000);
    if (element) {
      const text = cleanText(element.textContent);
      if (text && text.length >= 2 && text.length <= 80) {
        foundName = text;
        debug(`extractTargetProfileAsync: name found via "${selector}" → "${foundName}"`);
        break;
      }
    }
    debug(`extractTargetProfileAsync: "${selector}" not found or invalid`);
  }

  if (foundName) {
    // Name found — extraction will proceed normally.
  } else {
    warn("extractTargetProfileAsync: name not found by any selector, will try heuristic extraction");
  }

  // Trigger lazy-loaded sections (About, Experience, Education) by scrolling.
  await triggerLazyLoad();

  // Run the full extraction now that all sections should be rendered.
  return extractTargetProfile();
}

/**
 * Clean up a profile for logging/debugging.
 * In production the caller should not invoke this; the function is kept
 * as a no-op so that development builds can re-enable it.
 */
export function logExtractedProfile(_profile: TargetProfile): void {
  // Intentional no-op in production build.
}

/**
 * Dump ALL visible text from the LinkedIn profile page as a raw text blob.
 * This is the "brute force" approach — instead of trying to precisely parse CSS
 * selectors (which break every time LinkedIn changes its layout), we grab
 * everything and let the LLM do the parsing.
 *
 * Strategy:
 * 1. Clone the body, strip nav/footer/script/style/svg
 * 2. Grab innerText from the remaining DOM
 * 3. Light cleanup (excessive whitespace)
 * 4. Cap at 12000 chars to stay within API token limits
 */
export function dumpProfileRawText(): string {
  // Clone the body to avoid mutating the live page
  const clone = document.body.cloneNode(true) as HTMLElement;

  // Aggressively strip navigation, footer, and non-content elements
  const removeSelectors = [
    "nav",
    "footer",
    "script",
    "style",
    "noscript",
    "svg",
    "[role='navigation']",
    "[role='contentinfo']",
    "#global-nav",
    ".global-nav",
    "header.global-header",
    ".msg-overlay-list-bubble", // Messaging overlay
  ];

  for (const sel of removeSelectors) {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Also remove the bottom "People also viewed" / "Ads" areas that LinkedIn
  // commonly appends to the main content
  const asideElements = clone.querySelectorAll("aside");
  asideElements.forEach((el) => el.remove());

  // Grab visible text
  let text = clone.innerText || "";

  // Light cleanup: normalize whitespace
  text = text.replace(/[\t ]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  // Cap at 16000 chars — DeepSeek can handle ~16k tokens, this ensures we capture
  // the full About section even on long profiles with extensive experience entries
  const maxChars = 16000;
  if (text.length > maxChars) {
    debug(`dumpProfileRawText: trimming from ${text.length} to ${maxChars} chars`);
    text = text.slice(0, maxChars);
  }

  debug(`dumpProfileRawText: ${text.length} chars dumped`);
  return text;
}
