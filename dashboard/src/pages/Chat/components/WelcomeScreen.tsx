import { useTranslation } from "react-i18next";
import { useWelcomeQuickCardsLayout } from "../hooks/useWelcomeQuickCardsLayout";
import styles from "../index.module.less";
import WelcomeQuickCards, { WelcomeQuickCardProbe } from "./WelcomeQuickCards";

// Transparent-background logo so it blends with the chat surface.
const LOGO_SRC = "/logo_horizontal_white.png";

export interface WelcomeQuickCard {
  title: string;
  description: string;
  prompt: string;
  color: string;
  icon_name?: string | null;
  icon_url?: string | null;
  expertName?: string;
}

interface WelcomeScreenProps {
  onPromptClick: (text: string, options?: { prefill?: boolean }) => void;
  agentName?: string | null;
  welcomeSuffix?: string | null;
  quickCards: WelcomeQuickCard[];
  hideMascot?: boolean;
  isTeam?: boolean;
}

export default function WelcomeScreen({
  onPromptClick,
  agentName,
  welcomeSuffix,
  quickCards,
  hideMascot = false,
  isTeam = false,
}: WelcomeScreenProps) {
  const { t } = useTranslation();
  const {
    welcomeRef,
    headingRef,
    sectionTitleRef,
    probeRef,
    expanded,
    setExpanded,
    cards,
    showToggle,
    autoHideMascot,
  } = useWelcomeQuickCardsLayout(quickCards);

  const showMascot = !hideMascot && !autoHideMascot;

  return (
    <div className={styles.welcome} ref={welcomeRef}>
      <div className={styles.welcomeInner}>
        <div className={styles.welcomeHeading} ref={headingRef}>
          {showMascot && (
            <img
              className={styles.welcomeMascot}
              src={LOGO_SRC}
              alt="YYC3-Pai"
              draggable={false}
            />
          )}
          <h1 className={styles.welcomeTitle}>
            {isTeam
              ? t("chatWelcome.teamHeading", {
                  name: agentName?.trim() || t("chatWelcome.teamNameFallback"),
                })
              : t("chatWelcome.greeting")}
          </h1>
          <p className={styles.welcomeSubtitle}>
            {isTeam ? (
              <span className={styles.welcomeSubtitleText}>
                {welcomeSuffix ?? t("chatWelcome.descriptionWithTeamSuffix")}
              </span>
            ) : agentName ? (
              <>
                <span className={styles.welcomeAgentLine}>
                  <span className={styles.welcomeAgentMention}>
                    @{agentName}
                  </span>
                </span>
                <span className={styles.welcomeSubtitleText}>
                  {welcomeSuffix ?? t("chatWelcome.descriptionWithAgentSuffix")}
                </span>
              </>
            ) : (
              t("chatWelcome.description")
            )}
          </p>
        </div>

        {quickCards.length > 0 && (
          <WelcomeQuickCards
            cards={cards}
            showToggle={showToggle}
            expanded={expanded}
            onToggle={() => setExpanded((prev) => !prev)}
            onPromptClick={onPromptClick}
            sectionTitleRef={sectionTitleRef}
          />
        )}
      </div>

      {quickCards.length > 0 && <WelcomeQuickCardProbe probeRef={probeRef} />}
    </div>
  );
}
