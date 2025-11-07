const Answer = ({ answer }: { answer: string }) => {
    return (
        <div className="answer-option">
            {answer}
        </div>
    );
};

export default Answer;