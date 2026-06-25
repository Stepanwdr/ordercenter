import styled from "styled-components";
import {Input} from "@shared/ui/Input.tsx";
import {Dropdown} from "@shared/ui/Dropdown.tsx";
import {type FC} from "react";

interface Props {

  formData:Record<string, string>;
  setFormData:( field:string, value:string) => void
}
export const CustomerBlock: FC<Props> = ({setFormData,formData}) => {

  return (
    <Section>
    <BlockTitle>Պատվիրատույի տվյալներ</BlockTitle>
    <FieldGrid>
      <Input
        value={formData.customerName}
        onChange={(event) => setFormData('customerName',event.target.value)}
        placeholder="Պատվիրատուի անունը"
      />
      <Input
        value={formData.customerPhone}
        onChange={(event) => setFormData('customerPhone',event.target.value)}
        placeholder="+374 00 000000"
      />
    </FieldGrid>
    <InputWrapper>
      <Label>Ստացման եղանակ</Label>
      <Dropdown
        value={formData.orderType}
        options={[
          { value: 'delivery', label: 'Առաքում' },
          { value: 'dine_in', label: 'Տեղում' },
        ]}
        placeholder="Ընտրել"
        triggerDisplay="chip"
        onChange={(value) => setFormData('orderType', value || 'delivery')}
      />
    </InputWrapper>
    {formData.orderType === 'delivery' && (
      <>
      <FieldGrid>
        <InputWrapper>
          <Label>Քաղաք</Label>
          <Input
            value={formData.city}
            onChange={(event) => setFormData('city',event.target.value)}
            placeholder="Քաղաք"
          />
        </InputWrapper>
        <InputWrapper>
          <Label>Թաղ</Label>
          <Input
            value={formData.street}
            onChange={(event) => setFormData('street',event.target.value)}
            placeholder="Թաղ"
          />
        </InputWrapper>
      </FieldGrid>
        <FieldGrid>
          <InputWrapper>
            <Label>Շենք</Label>
            <Input
              value={formData.building}
              onChange={(event) => setFormData("building",event.target.value)}
              placeholder="Շենք"
            />
          </InputWrapper>
          <InputWrapper>
            <Label>Մուտք</Label>
            <Input
              value={formData.entrance}
              onChange={(event) => setFormData("entrance",event.target.value)}
              placeholder="Մուտք"
            />
          </InputWrapper>
          <InputWrapper>
            <Label>Հարկ</Label>
            <Input
              value={formData.floor}
              onChange={(event) => setFormData("floor",event.target.value)}
              placeholder="Հարկ"
            />
          </InputWrapper>
          <InputWrapper>
            <Label>Բնակարան/տուն/գրասենյակ</Label>
            <Input
              value={formData.apartment}
              onChange={(event) => setFormData("apartment",event.target.value)}
              placeholder="Բնակարան/տուն/գրասենյակ"
            />
          </InputWrapper>
          <InputWrapper>
            <Label>Դոմոֆոն</Label>
            <Input
              value={formData.domofon}
              onChange={(event) => setFormData("domofon",event.target.value)}
              placeholder="Դոմոֆոն"
            />
          </InputWrapper>
          <InputWrapper>
            <Label>Մեկնաբանություն</Label>
            <Input
              value={formData.addressComment}
              onChange={(event) => setFormData("addressComment",event.target.value)}
              placeholder="Մեկնաբանություն"
            />
          </InputWrapper>
        </FieldGrid>

      </>
    )}
  </Section>)
}

const Panel = styled.section`
    display: grid;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
`;

const InputWrapper = styled.div`
display: flex;
gap: 8px;
    flex-direction: column;
;`

const Label = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Section = styled(Panel)`
    grid-column: 1 / -1;
`;

const BlockTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;