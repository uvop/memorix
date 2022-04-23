import { useCallback } from "react";
import {
  useListenToMessagesSubscription,
  useSendMessageMutation,
} from "./data.generated";

export const Chat = () => {
  const [sendMessage] = useSendMessageMutation();
  const { data } = useListenToMessagesSubscription();
  const handleSubmit = useCallback<
    NonNullable<React.ComponentProps<"form">["onSubmit"]>
  >(
    async (e) => {
      e.preventDefault();

      const input = (e.target as any).message as HTMLInputElement;
      await sendMessage({
        variables: {
          message: input.value,
        },
      });
      input.value = "";
    },
    [sendMessage]
  );

  return (
    <div>
      <div>
        <div>Last message:</div>
        {data && <div>{data.listenToEchoes}</div>}
      </div>
      <form onSubmit={handleSubmit}>
        <input name="message" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};
