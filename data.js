// Seed data — a couple of candidates already exist so duplicate-email checks
// against pre-existing records are testable from the very first upload.
function makeSeed() {
  const candidates = [
    {
      id: 1,
      name: 'Asha Rao',
      email: 'asha.rao@example.com',
      phone: '+919876543210',
      normalizedPhone: '9876543210',
      createdAt: '2026-07-01T00:00:00.000Z'
    },
    {
      id: 2,
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      phone: '+918765432109',
      normalizedPhone: '8765432109',
      createdAt: '2026-07-02T00:00:00.000Z'
    }
  ];

  return { candidates, nextId: candidates.length + 1 };
}

module.exports = { makeSeed };
