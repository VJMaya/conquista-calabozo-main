export const stages = [
  {
    stageNumber: 1,
    title: 'La Entrada del Calabozo',
    timeLimitSeconds: 60,

    questions: [
      {
        id: 'q1',
        questionType: 'multiple_choice',
        questionText: '¿Cuál es la capital de México?',
        optionA: 'Monterrey',
        optionB: 'Guadalajara',
        optionC: 'Ciudad de México',
        optionD: 'Puebla',
        correctAnswer: 'C',
        pointsBase: 100,
      },
      {
        id: 'q2',
        questionType: 'true_false',
        questionText: 'Oaxaca pertenece a México',
        correctAnswer: 'True',
        pointsBase: 50,
      },
    ],
  },

  {
    stageNumber: 2,
    title: 'El Bosque Maldito',
    timeLimitSeconds: 45,

    questions: [
      {
        id: 'q3',
        questionType: 'multiple_choice',
        questionText: '¿Cuánto es 3 x 5?',
        optionA: '10',
        optionB: '15',
        optionC: '20',
        optionD: '25',
        correctAnswer: 'B',
        pointsBase: 100,
      },
    ],
  },
];