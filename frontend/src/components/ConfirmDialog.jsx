import Modal from "./Modal";

export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  danger = true,
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}