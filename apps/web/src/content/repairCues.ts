/**
 * Context-specific guided self-repair for the 28 existing B1 cloze drafts.
 * R03 / COG-05 / PSY-02: do NOT misdiagnose a tense, negation or valency task
 * as a motion/location exercise. These are original provisional teaching
 * questions, NOT reviewed Finnish answer keys or an automatic error classifier.
 *
 * The prompt depends ONLY on the task's editorial grammar tag, not on an
 * invented diagnosis of the user's actual mistake. It is shown only in the
 * mission "repair" phase, after a frozen independent first attempt.
 */
const REPAIR_QUESTIONS: Readonly<Record<string, string>> = Object.freeze({
  illatiivi: "Речення описує рух. Подумай, куди саме спрямована дія, і перевір форму назви місця.",
  elatiivi: "Речення описує початок руху. Звідки людина повертається або виходить? Перевір форму місця.",
  inessiivi: "Тут не рух, а перебування. Де саме відбувається дія? Перевір форму місця.",
  allatiivi: "У дії є адресат. Кому телефонують або до кого звертаються? Перевір керування дієслова.",
  rektio_partitiivi: "Якого відмінка вимагає дієслово від свого додатка? Перевір керування цілої конструкції.",
  partitiivi: "Зверни увагу на заперечення та значення кількості. Яку форму іменника потребує це речення?",
  imperfekti: "Подія вже відбулася. Перевір минулий час, особу підмета й зміну основи дієслова.",
  perfekti: "Подія пов'язана з теперішнім. Чи потрібні допоміжне дієслово й відповідна форма основного?",
  negation: "Частка заперечення вже стоїть у реченні. Перевір, яка форма основного дієслова йде після неї.",
  konditionaali: "Йдеться про уявну умову. Перевір умовний спосіб і форму дієслова для цього підмета.",
  politeness: "Це ввічливе запитання. Перевір особу, умовний спосіб і питальну форму дієслова.",
  rektio_elatiivi: "Визнач словосполучення цілком: якого відмінка вимагає прикметник або дієслово? Це не питання про рух.",
  adessiivi: "Йдеться про засіб пересування. Чим саме відбувається поїздка? Перевір форму назви транспорту.",
  object: "Подумай, чи завершена і конкретна дія над об'єктом. Значення речення впливає на форму додатка.",
  numerals: "Поглянь на числівник: яку форму й число має іменник після позначення кількості?",
  plural: "Підмет складається з кількох предметів. Узгодь прикметник та іменник у числі й формі.",
  necessity: "Після виразу необхідності перевір форму основного дієслова: особова вона чи неозначена?",
  passive_past: "Подію виконали раніше, виконавець не названий. Перевір минулий час безособової форми.",
  past_negation: "Речення заперечне й стосується минулого. Перевір обидві частини заперечної дієслівної конструкції.",
  genetiivi: "Знайди післяйменник. Яку форму він вимагає від іменника перед собою?",
  verb_type_4: "Перевір тип відмінювання дієслова, зміну основи та особове закінчення для підмета.",
  verb_type_1: "Перевір особу підмета, голосний основи та потрібну особову форму дієслова.",
  kpt: "Перевір чергування приголосних у дієслівній основі й закінчення відповідної особи.",
  plural_verb: "Підмет у множині. Перевір особу та число дієслова, не лише його початкову форму.",
  perfect_plural: "Перевір узгодження допоміжного дієслова й основного дієслова у перфекті множини.",
});

const FALLBACK = "Перечитай зміст усього речення: яку роль має пропуск? Перевір правило для цієї конструкції, потім спробуй ще раз.";

export function repairQuestionFor(grammarTag: string | null | undefined): string {
  return grammarTag && Object.hasOwn(REPAIR_QUESTIONS, grammarTag)
    ? REPAIR_QUESTIONS[grammarTag]!
    : FALLBACK;
}
export function coveredRepairTags(): string[] { return Object.keys(REPAIR_QUESTIONS); }
