# Default Item Pool

~80 concrete items + 2 templates. Mix of nature finds and team activities. Keep names to ~3 words max.

## Templates

Templates generate board items at round time by substituting a random value. Max 5 template-generated items per board of 25. No duplicate values on the same board.

### Something [colour]
**Values:** Red, Blue, Green, Yellow, Orange, Brown, White, Black, Purple, Pink

### Something [texture]
**Values:** Smooth, Rough, Bumpy, Soft, Spiky, Fuzzy, Hard, Crumbly

---

## Nature — Trees & Plants
1. Oak leaf
2. Pine cone
3. Birch bark
4. Fern frond
5. Moss patch
6. Wild flower
7. Dandelion clock
8. Ivy leaf
9. Holly leaf
10. Bramble bush
11. Fallen log
12. Tree stump
13. Lichen on rock
14. Mushroom
15. Acorn
16. Conker
17. Sycamore seed
18. Nettle patch
19. Clover patch
20. Daisy

## Nature — Animals & Insects
21. Spider web
22. Bird in tree
23. Ant trail
24. Worm
25. Butterfly or moth
26. Snail
27. Slug
28. Beetle
29. Squirrel
30. Bird nest
31. Feather
32. Animal footprint
33. Caterpillar
34. Ladybird
35. Bee on flower

## Nature — Landscape & Features
36. Puddle reflection
37. Cloud shape
38. Stream or ditch
39. Rocky outcrop
40. Muddy patch
41. Animal hole
42. Fallen branch
43. Twisted tree
44. Split in bark
45. Tall tree
46. Tiny plant
47. Heart-shaped leaf
48. Y-shaped stick
49. Tree with no leaves
50. Patch of wildflowers

## Activities & Challenges
51. Team star jump
52. Leaf crown
53. Stick tower
54. Nature face art
55. Tree hug photo
56. Bark rubbing
57. Grass whistle
58. Stone stack
59. Shadow selfie
60. Camouflage team
61. Leaf boat
62. Big stick
63. Team bridge pose
64. Nature letter "S"
65. Mud war paint

## Scavenger Finds
66. Something camouflaged
67. Three different leaves
68. Two different berries
69. Matching pair
70. Something weathered
71. Something nibbled
72. Something man-made
73. Interesting pattern
74. A hole in a leaf
75. Curly twig

## Observation
76. Bird flying
77. Sun through leaves
78. Dew drops
79. Insect home
80. Seed dispersal
81. Decomposing leaf
82. Animal territory mark
83. Wind effect
84. Water source
85. Night-time creature sign

---

## Template Rules

Board size and template count are configured per game by the admin (see product spec). Defaults: 25 board size, 5 template items.

When generating a round board:

1. Calculate concrete item count = board size - template count
2. Select that many concrete items randomly from the pool
   - Items used in the last 2 rounds are avoided where possible (soft constraint)
   - When the pool is exhausted, reuse items oldest-used-first
3. Fill remaining slots with template-generated items:
   - Pick a template ("Something [colour]" or "Something [texture]")
   - Pick a random value from that template's value list
   - Ensure no duplicate template+value combos on the board
4. Shuffle all items into random board order
