$.i18n().load({
    en: {
        MSG_ASSEMBLY: "hello!",
        msg_no_answer: "No answer provided.",
        msg_asm_check_me: "Check",
        msg_asm_incorrect: "Incorrect. Please think again.",
        msg_asm_correct: "Correct. Good job!",
        msg_asm_generate_another: "Generate another question",
        msg_asm_imcomplete_answer: "Your selection is incomplete",
    }
}).done(function() {
    console.log("i18n messages loaded successfully");
}).fail(function() {
    console.error("Failed to load i18n messages");
});