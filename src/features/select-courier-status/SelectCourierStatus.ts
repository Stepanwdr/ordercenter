import type {CourierStatus} from "@shared/types";

type CourierLocationStatus = CourierStatus;

export const courierLocationOptions: { value: CourierLocationStatus; label: string }[] = [
  { value: 'atRestaurant', label: 'Ռեստորանում է' },
  { value: 'pickedUp', label: 'Պատվերը վերցրել է' },
  { value: 'enRoute', label: 'Ճանապարհին է' },
  { value: 'delivered', label: 'Հասել է' },
  { value: 'free', label: 'Ազատ է' },
  { value: 'dayOff', label: 'Աշատանքի չէ' },
  { value: 'offline', label: 'Կապից դուրս' },
  { value: 'busy', label: 'Զբաղված է' },
];


export const getStatusLabelOptions: Record<CourierLocationStatus, string> = {
  atRestaurant:'Ռեստորանում է',
  pickedUp:"Պատվերը վերցրել է",
  enRoute:"Ճանապարհին է",
  delivered:"Հասել է",
  free:"Ազատ է",
  dayOff:"Աշատանքի չէ",
  offline:"Կապից դուրս",
  busy:'Զբաղված է'
}