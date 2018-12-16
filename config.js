const SECONDS_PER_MONTH = 2628000;

const MONTHS_TO_CLIFF = 12;
const MONTHS_TO_RELEASE = 48;

const VESTED_TOKENS = 1200;

const FIRST_PHASE = MONTHS_TO_RELEASE / 4;
const SECOND_PHASE = 6;
const THIRD_PHASE = MONTHS_TO_RELEASE - FIRST_PHASE - SECOND_PHASE;

if (MONTHS_TO_RELEASE % 2 !== 0) {
  throw new ReferenceError("Months must be an even number");
}

if (MONTHS_TO_RELEASE % 2 !== 0) {
  throw new ReferenceError("Months must be an even number");
}

if (VESTED_TOKENS % MONTHS_TO_RELEASE !== 0 ) {
  throw new ReferenceError("Total vested token amount is not cleanly divisible by the months");
}

const TOKENS_PER_MONTH = VESTED_TOKENS / MONTHS_TO_RELEASE;

const CLIFF_DURATION = SECONDS_PER_MONTH * MONTHS_TO_CLIFF;
const RELEASABLE_DURATION = SECONDS_PER_MONTH * MONTHS_TO_RELEASE;
const TOTAL_VEST_DURATION = RELEASABLE_DURATION + CLIFF_DURATION;

if (RELEASABLE_DURATION % SECONDS_PER_MONTH !== 0) {
  throw new ReferenceError("Releasable duration is a multiple of months");
}

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
  THIRD_PHASE,
};
