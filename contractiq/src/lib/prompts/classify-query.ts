export type QueryClass = 'contract' | 'history' | 'both';

const HISTORY_SIGNAL =
  /\b(you (said|mentioned|told|wrote|answered)|earlier|previous(ly)?|before|last (answer|question|message)|what did (i|we) (ask|discuss)|repeat that|summari[sz]e (our|this) (chat|conversation))\b/i;

const CONTRACT_SIGNAL =
  /\b(clause|section|page|agreement|contract|part(y|ies)|terms?|notice|payment|liabilit\w*|terminat\w*|renew\w*|governing|confidential\w*|indemn\w*)\b/i;

/**
 * Cheap, deterministic routing of a question (no model call). It only changes the system prompt addendum;
 * the contract text is always sent, so a wrong guess can never remove grounding.
 */
export function classifyQuery(message: string): QueryClass {
  const history = HISTORY_SIGNAL.test(message);
  const contract = CONTRACT_SIGNAL.test(message);
  if (history && contract) return 'both';
  if (history) return 'history';
  return 'contract';
}
