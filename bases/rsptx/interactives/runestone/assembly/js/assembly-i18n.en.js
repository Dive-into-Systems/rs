$.i18n().load({
    en: {
        MSG_ASSEMBLY: "hello!",
        msg_no_answer: "No answer provided.",
        msg_ASM_check_me: "Check",
        msg_ASM_incorrect: "Incorrect. Please think again.",
        msg_ASM_correct: "Correct. Good job!",
        msg_ASM_generate_another: "Ask me another",
        msg_ASM_imcomplete_answer: "Your selection is incomplete",
    }
}).done(function() {
    console.log("i18n messages loaded successfully");
}).fail(function() {
    console.error("Failed to load i18n messages");
});