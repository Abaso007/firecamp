import { FC, useCallback, useState } from 'react';
import cx from 'classnames';
import {
  Button,
  DropdownV2,
  Container,
  FormField,
  ProgressBar,
} from '@firecamp/ui';
import RolesCallout from '../RolesCallout';
import { _array, _misc } from '@firecamp/utils';
import { EUserRolesWorkspace } from '../../../../../types';
import { useWorkspaceStore } from '../../../../../store/workspace';
import platformContext from '../../../../../services/platform-context';

const RoleOptions = [
  {
    id: EUserRolesWorkspace.Admin,
    name: 'Admin',
  },
  {
    id: EUserRolesWorkspace.Collaborator,
    name: 'Collaborator',
  },
];

const InviteOrgMembers: FC<IProps> = ({
  state: member,
  members = [],
  isFetchingMembers = false,
  onChange,
}) => {
  const { inviteOrgMembers } = useWorkspaceStore.getState();
  const [isInvitingMembers, setInvitingFlag] = useState(false);

  // send new / existing member invitation
  const sendInvitation = useCallback(() => {
    if (!member.id || !member.email || !member.role) return;
    setInvitingFlag(true);
    inviteOrgMembers([{id: member.id, name: member.name, email: member.email}], member.role).finally(() => {
      setInvitingFlag(false);
    });
  }, [member]);

  const _role = RoleOptions.find((r) => r.id == member.role);
  return (
    <Container className="gap-2">
      <Container.Header className="text-base font-semibold leading-3 text-app-foreground-inactive p-6">
        Invite your team colleagues to join the workspace.
      </Container.Header>
      <Container.Body className="invisible-scrollbar w-[32rem] h-80">
        <FormField
          label="Invite member from your organization"
          className="relative"
        >
          <DropdownV2
            handleRenderer={() => (
              <div className="relative">
                <Button
                  text={member.name || 'Select member'}
                  className={cx(
                    'hover:!bg-focus1 border border-app-border justify-between'
                    // { 'border-error': !member.name }
                  )}
                  disabled={members.length === 0}
                  transparent
                  withCaret
                  fullWidth
                  ghost
                  md
                />
                <ProgressBar className="top-auto" active={isFetchingMembers} />
              </div>
            )}
            classes={{
              trigger: 'block',
              options: 'w-[32rem] bg-popover-background z-[1000] -mt-1',
              item: 'px-4 text-sm hover:!bg-focus1 focus-visible:!bg-focus1 leading-6 focus-visible:!shadow-none',
            }}
            options={members}
            onSelect={(m) => onChange({ ...member, ...m })}
          />
        </FormField>
        <FormField label="Assign role for selected member">
          <DropdownV2
            handleRenderer={() => (
              <Button
                text={_role.name || 'Select role'}
                className={cx(
                  'hover:!bg-focus1 border border-app-border justify-between'
                )}
                withCaret
                transparent
                fullWidth
                ghost
                md
              />
            )}
            options={RoleOptions}
            classes={{
              trigger: 'block',
              options: 'w-[32rem] bg-popover-background z-[1000] -mt-1',
              item: 'px-4 text-sm hover:!bg-focus1 focus-visible:!bg-focus1 leading-6 focus-visible:!shadow-none',
            }}
            onSelect={({ name, id }) => onChange({ ...member, role: id })}
          />
        </FormField>
        <RolesCallout role={_role.id} />
      </Container.Body>
      <Container.Footer className="flex items-center">
        <a
          className="!text-link hover:!text-link hover:underline cursor-pointer text-sm px-2 pl-0"
          target="_blank"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            platformContext.app.modals.openWorkspaceManagement();
          }}
        >
          Open Workspace Management
        </a>
        <Button
          className="ml-auto inline"
          text={'Send Invitation'}
          disabled={!member.name || !member.role || isInvitingMembers}
          onClick={sendInvitation}
          primary
          sm
        />
      </Container.Footer>
    </Container>
  );
};

export default InviteOrgMembers;

type TMember = {
  id: string;
  name: string;
  email: string;
  role: EUserRolesWorkspace;
};
interface IProps {
  state: TMember;
  members: { id: string; name: string; email: string }[];
  isFetchingMembers: boolean;
  onChange: Function;
}
