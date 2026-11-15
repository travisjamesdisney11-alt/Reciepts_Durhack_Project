import unittest

from app.auth import validate_password


class PasswordValidationTests(unittest.TestCase):
    def test_accepts_password_meeting_all_requirements(self):
        self.assertIsNone(validate_password("Abc!defg"))

    def test_requires_at_least_eight_characters(self):
        self.assertEqual(validate_password("Ab!def"), "Password must be at least 8 characters")

    def test_requires_uppercase_and_lowercase_letters(self):
        self.assertEqual(validate_password("abcdefg!"), "Password must include an uppercase letter")
        self.assertEqual(validate_password("ABCDEFG!"), "Password must include a lowercase letter")

    def test_requires_a_punctuation_or_symbol_character(self):
        self.assertEqual(validate_password("Abcdefg1"), "Password must include a special symbol")
        self.assertEqual(validate_password("Abc def1"), "Password must include a special symbol")

    def test_rejects_passwords_over_the_existing_length_limit(self):
        self.assertEqual(validate_password(f"Aa!{'b' * 126}"), "Password must be no more than 128 characters")


if __name__ == "__main__":
    unittest.main()
