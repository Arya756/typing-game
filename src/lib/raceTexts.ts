export type Difficulty = "easy" | "medium" | "hard";

// Fun-fact style sentences, grouped by difficulty — short & simple for easy,
// longer with punctuation/numbers for hard, similar to Type Rush.
const EASY: string[] = [
  "The sun is a star at the center of our solar system.",
  "Cats sleep for most of the day and night.",
  "Honey never spoils if it is stored the right way.",
  "A rainbow appears when light passes through raindrops.",
  "Bananas are berries but strawberries are not.",
  "Octopuses have three hearts and blue blood.",
  "The Eiffel Tower is located in Paris, France.",
  "Sharks existed before trees appeared on Earth.",
  "A group of flamingos is called a flamboyance.",
  "Sloths can hold their breath longer than dolphins can.",
  "Lightning is hotter than the surface of the sun.",
  "Penguins propose to their mates with a pebble.",
  "The human heart beats about one hundred thousand times a day.",
  "Mount Everest is the tallest mountain above sea level.",
  "Dolphins sleep with one eye open.",
];

const MEDIUM: string[] = [
  "A bolt of lightning contains enough energy to toast about 100,000 slices of bread, though you would not want to try it.",
  "The Great Wall of China is not actually visible from space with the naked eye, despite the popular myth.",
  "Octopuses can change both the color and the texture of their skin in less than a second to blend into their surroundings.",
  "Venus is the hottest planet in our solar system, even though Mercury is closer to the sun.",
  "A single cloud can weigh more than a million pounds, yet it still floats gracefully in the sky above us.",
  "The shortest war in recorded history lasted only 38 minutes, between Britain and Zanzibar in 1896.",
  "Wombat droppings are cube-shaped, which stops them from rolling away and helps mark their territory.",
  "Bananas, strawberries, and avocados are all technically classified as berries by botanists.",
  "Your nose can remember about 50,000 different scents, helping you recall memories tied to smell.",
  "The inventor of the Pringles can is now buried in one, as per his own request after he passed away.",
  "A day on Venus is longer than its year because the planet rotates so slowly on its axis.",
  "Honeybees communicate the location of flowers to each other by performing a waggle dance.",
];

const HARD: string[] = [
  "In 1965, Gordon Moore predicted that the number of transistors on a microchip would double roughly every two years, a trend now known as Moore's Law, which fueled decades of exponential growth in computing power (and cost).",
  "The Mariana Trench, located in the western Pacific Ocean, plunges to a depth of approximately 10,935 meters — deeper than Mount Everest (8,849 m) is tall, meaning Everest could sink into it with room to spare.",
  "Between 1,000 BCE and 500 CE, the Library of Alexandria housed anywhere from 40,000 to 400,000 scrolls; historians still debate its exact size, and its eventual destruction remains a point of scholarly controversy.",
  "According to NASA, a single teaspoon of a neutron star would weigh about 6 billion tons on Earth — roughly the same as a mountain compressed into a space smaller than a sugar cube!",
  "The 1908 Tunguska event flattened an estimated 80 million trees across 2,150 square kilometers of Siberian forest, yet no impact crater was ever found, fueling theories ranging from meteors to comets.",
  "Did you know that the world's oldest known piece of chewing gum, discovered in Finland, is nearly 5,700 years old and still bears the tooth marks of a Stone Age teenager?",
  "Quantum entanglement — what Einstein famously called 'spooky action at a distance' — allows two particles to instantaneously affect each other's state, regardless of the (sometimes vast) distance separating them.",
  "The Antikythera mechanism, recovered from a shipwreck in 1901, is a 2,000-year-old analog computer used to predict astronomical positions and eclipses decades in advance — a feat not replicated until the 14th century.",
];

export function pickRandomText(difficulty: Difficulty): string {
  const pool = difficulty === "easy" ? EASY : difficulty === "hard" ? HARD : MEDIUM;
  return pool[Math.floor(Math.random() * pool.length)];
}
