const SECONDS_PER_MONTH = 2628000;

const MONTHS_TO_CLIFF = 2;
const MONTHS_TO_RELEASE = 10;

const VESTED_TOKENS = 1000;

const TOKENS_PER_MONTH = Math.floor(VESTED_TOKENS / MONTHS_TO_RELEASE);

const CLIFF_DURATION = SECONDS_PER_MONTH * MONTHS_TO_CLIFF;
const RELEASABLE_DURATION = SECONDS_PER_MONTH * MONTHS_TO_RELEASE;
const TOTAL_VEST_DURATION = RELEASABLE_DURATION + CLIFF_DURATION;

const FIRST_PHASE = Math.floor(MONTHS_TO_RELEASE / 2);
const SECOND_PHASE = 2;

module.exports = {
  SECONDS_PER_MONTH,
  MONTHS_TO_CLIFF,
  MONTHS_TO_RELEASE,
  VESTED_TOKENS,
  TOKENS_PER_MONTH,
  CLIFF_DURATION,
  RELEASABLE_DURATION,
  TOTAL_VEST_DURATION,
  FIRST_PHASE,
  SECOND_PHASE,
};