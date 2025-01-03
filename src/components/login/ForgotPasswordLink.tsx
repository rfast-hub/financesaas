const ForgotPasswordLink = ({ onClick }: { onClick: () => void }) => (
  <div className="text-center mt-4">
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-primary hover:underline"
    >
      Forgot password?
    </button>
  </div>
);

export default ForgotPasswordLink;